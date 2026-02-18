/**
 * 이메일 인증번호 검증 API
 *
 * POST /api/auth/verify-otp
 * Body: { email, code }
 *
 * - 최대 5회 시도 제한
 * - 5분 만료
 */
import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit/helpers"

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  // Rate Limit: OTP 무차별 대입 방지 (IP당 15분간 15회)
  const ip = getClientIP(request)
  const rateLimited = await checkRateLimit(ip, "otpVerify")
  if (rateLimited) return rateLimited

  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "이메일과 인증번호를 입력해주세요." }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 최신 미인증 레코드 조회
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verification) {
      return NextResponse.json({ error: "인증번호를 먼저 발송해주세요." }, { status: 400 })
    }

    // 만료 확인
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "인증번호가 만료되었습니다. 다시 발송해주세요." },
        { status: 400 }
      )
    }

    // 시도 횟수 확인
    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "인증 시도 횟수를 초과했습니다. 인증번호를 다시 발송해주세요." },
        { status: 400 }
      )
    }

    // 코드 비교
    if (verification.code !== code) {
      // 시도 횟수 증가
      await supabase
        .from("email_verifications")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id)

      const remaining = MAX_ATTEMPTS - verification.attempts - 1
      return NextResponse.json(
        {
          error: `인증번호가 올바르지 않습니다. (남은 시도: ${remaining}회)`,
        },
        { status: 400 }
      )
    }

    // 인증 성공
    await supabase.from("email_verifications").update({ verified: true }).eq("id", verification.id)

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
    })
  } catch (error) {
    console.error("[Verify OTP] 오류:", error)
    return NextResponse.json({ error: "인증번호 확인 중 오류가 발생했습니다." }, { status: 500 })
  }
}
