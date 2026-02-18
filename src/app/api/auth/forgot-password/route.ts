/**
 * 비밀번호 재설정 이메일 발송 API
 * generateLink + Resend로 이메일 발송 (Supabase 내장 SMTP rate limit 우회)
 *
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * 보안 조치:
 * - 이메일 존재 여부와 관계없이 동일한 성공 응답 (이메일 열거 방지)
 * - 1분 쿨다운 (서버 사이드)
 */
import { NextRequest, NextResponse } from "next/server"
import { sendRecoveryEmail } from "@/lib/email/resend"
import { getAdminClient } from "@/lib/supabase/admin"
import { isValidEmail } from "@/lib/validation"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit/helpers"

// 기존 인메모리 cooldownMap은 서버리스 환경에서 작동하지 않아 제거
// → Upstash Redis 기반 rate limiting으로 교체

export async function POST(request: NextRequest) {
  // Rate Limit: 비밀번호 재설정 남용 방지 (IP당 분당 10회)
  const ip = getClientIP(request)
  const rateLimited = await checkRateLimit(ip, "critical")
  if (rateLimited) return rateLimited

  try {
    const { email } = await request.json()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "유효한 이메일 주소를 입력해주세요." }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const supabaseAdmin = getAdminClient()

    // 사이트 URL
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000")

    // generateLink로 복구 링크 생성
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (error) {
      // 사용자가 존재하지 않아도 동일한 성공 응답 (이메일 열거 방지)
      return NextResponse.json({ success: true })
    }

    // Resend로 복구 이메일 발송
    const recoveryLink = data.properties.action_link
    try {
      await sendRecoveryEmail(normalizedEmail, recoveryLink)
    } catch (emailError) {
      console.error("[Forgot Password] 이메일 발송 실패:", emailError)
      return NextResponse.json(
        { error: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Forgot Password] 오류:", error)
    return NextResponse.json(
      { error: "비밀번호 재설정 요청 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
