/**
 * 이메일 인증번호 발송 API
 *
 * POST /api/auth/send-otp
 * Body: { email }
 *
 * 보안 제한:
 * - 동일 이메일 1분 쿨다운
 * - 동일 이메일 24시간 내 최대 5회
 * - 동일 IP 1시간 내 최대 10회
 * - 이미 가입된 이메일 차단
 * - 인증번호 5분 만료, 최대 5회 시도
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email/resend'
import { OTP_LIMITS } from '@/lib/constants/otp'
import { getClientIP, checkDailyLimit, checkIPLimit } from '@/lib/otp/rate-limit'
import { getAdminClient } from '@/lib/supabase/admin'
import { isValidEmail } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const clientIP = getClientIP(request)

    // 이미 가입된 이메일인지 확인 (admin_created 고객은 OTP 허용)
    const [customerCheck, employeeCheck] = await Promise.all([
      supabase.from('customers').select('id').eq('email', email).maybeSingle(),
      supabase.from('employees').select('id').eq('email', email).maybeSingle(),
    ])

    if (employeeCheck.data) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 400 }
      )
    }

    // 기존 고객이 있으면 admin_created 여부 확인
    if (customerCheck.data) {
      const { data: { user: existingUser } } = await supabase.auth.admin.getUserById(customerCheck.data.id)
      const isAdminCreated = existingUser?.user_metadata?.admin_created === true
      if (!isAdminCreated) {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다.' },
          { status: 400 }
        )
      }
    }

    // IP 시간당 제한 (10회)
    const ipCheck = await checkIPLimit(supabase, 'email_verifications', clientIP)
    if (ipCheck.blocked) {
      return NextResponse.json(
        { error: ipCheck.message },
        { status: 429 }
      )
    }

    // 일일 발송 제한 (동일 이메일 5회)
    const dailyCheck = await checkDailyLimit(supabase, 'email_verifications', 'email', email)
    if (dailyCheck.blocked) {
      return NextResponse.json(
        { error: dailyCheck.message },
        { status: 429 }
      )
    }

    // 1분 쿨다운
    const oneMinuteAgo = new Date(Date.now() - OTP_LIMITS.COOLDOWN_SECONDS * 1000).toISOString()
    const { data: recentOtp } = await supabase
      .from('email_verifications')
      .select('id')
      .eq('email', email)
      .gte('created_at', oneMinuteAgo)
      .limit(1)
      .single()

    if (recentOtp) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도해주세요. (1분 후 재발송 가능)' },
        { status: 429 }
      )
    }

    // 6자리 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + OTP_LIMITS.EXPIRES_MINUTES * 60 * 1000).toISOString()

    // DB에 저장 (기존 레코드 삭제하지 않음 → 일일 카운트 정확도 유지)
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email,
        code,
        expires_at: expiresAt,
        ip_address: clientIP,
      })

    if (insertError) {
      console.error('[Send OTP] DB 저장 오류:', insertError)
      return NextResponse.json(
        { error: '인증번호 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 이메일 발송 (실패 시 DB 레코드 롤백)
    try {
      await sendVerificationEmail(email, code)
    } catch (emailError) {
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email)
        .eq('code', code)

      console.error('[Send OTP] 이메일 발송 실패:', emailError)
      return NextResponse.json(
        { error: '인증번호 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다.',
    })
  } catch (error) {
    console.error('[Send OTP] 오류:', error)
    return NextResponse.json(
      { error: '인증번호 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
