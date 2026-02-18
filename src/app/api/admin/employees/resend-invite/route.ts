/**
 * 직원 초대 재전송 API
 * 비활성 직원에게 초대 메일을 다시 발송
 *
 * POST /api/admin/employees/resend-invite
 * Body: { employeeId }
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
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json(
        { error: '직원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // 직원 조회
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, email, name, role, is_active')
      .eq('id', employeeId)
      .single()

    if (empError || !employee) {
      return NextResponse.json(
        { error: '해당 직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 활성화된 직원에게는 재전송 불가
    if (employee.is_active) {
      return NextResponse.json(
        { error: '이미 활성화된 직원입니다.' },
        { status: 400 }
      )
    }

    // generateLink로 새 초대 링크 생성 (기존 링크 무효화)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (
      process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000'
    )

    // 이미 auth.users에 존재하므로 recovery 타입 사용 (invite는 이미 등록된 이메일에 사용 불가)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: employee.email,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (error) {
      console.error('[Employee Resend Invite] generateLink 오류:', error)
      return NextResponse.json(
        { error: `초대 링크 생성에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    // Resend로 초대 이메일 재발송
    const inviteLink = data.properties.action_link
    try {
      await sendInviteEmail(employee.email, employee.name, inviteLink)
    } catch (emailError) {
      console.error('[Employee Resend Invite] 이메일 발송 실패:', emailError)
      return NextResponse.json(
        { error: '초대 이메일 발송에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { email: employee.email },
    })
  } catch (error) {
    console.error('[Employee Resend Invite] 오류:', error)
    return NextResponse.json(
      { error: '초대 재전송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
