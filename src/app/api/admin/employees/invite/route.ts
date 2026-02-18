/**
 * 직원 초대 API
 * Admin이 새 직원을 이메일로 초대
 * generateLink + Resend로 이메일 발송 (Supabase 내장 SMTP rate limit 우회)
 *
 * POST /api/admin/employees/invite
 * Body: { email, name, role }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { sendInviteEmail } from '@/lib/email/resend'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 권한 확인 (admin 이상)
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { email, name, role = 'staff' } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: '이메일과 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // 역할 유효성 검사
    if (!['staff', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    // super_admin만 admin 역할 부여 가능
    if (role === 'admin' && auth.data.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'super_admin만 admin 역할을 부여할 수 있습니다.' },
        { status: 403 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // 이메일 중복 확인
    const { data: existingUser } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 직원 이메일입니다.' },
        { status: 400 }
      )
    }

    // generateLink로 초대 링크 생성 (이메일 발송 안 함)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000'

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          invited_as: 'employee',
          name,
          role,
        },
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (error) {
      console.error('[Employee Invite] generateLink 오류:', error)
      return NextResponse.json(
        { error: `초대 링크 생성에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    // Resend로 초대 이메일 발송
    const inviteLink = data.properties.action_link
    try {
      await sendInviteEmail(email, name, inviteLink)
    } catch (emailError) {
      console.error('[Employee Invite] 이메일 발송 실패:', emailError)
      return NextResponse.json(
        { error: '초대 이메일 발송에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('[Employee Invite] 오류:', error)
    return NextResponse.json(
      { error: '직원 초대 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
