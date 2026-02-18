/**
 * 직원 비밀번호 리셋 API
 * Admin이 직원의 비밀번호를 직접 변경
 *
 * POST /api/admin/employees/reset-password
 * Body: { employeeId, newPassword }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 권한 확인 (admin 이상)
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { employeeId, newPassword } = await request.json()

    if (!employeeId || !newPassword) {
      return NextResponse.json(
        { error: '직원 ID와 새 비밀번호는 필수입니다.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 본인 비밀번호 변경 방지 (직접 변경은 프로필에서)
    if (employeeId === auth.data.id) {
      return NextResponse.json(
        { error: '본인 비밀번호는 프로필 설정에서 변경해주세요.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // 대상이 실제 직원인지 확인
    const { data: targetEmployee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, role')
      .eq('id', employeeId)
      .single()

    if (empError || !targetEmployee) {
      return NextResponse.json(
        { error: '해당 직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // admin은 super_admin의 비밀번호를 변경할 수 없음
    if (targetEmployee.role === 'super_admin' && auth.data.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super Admin의 비밀번호는 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    // Admin API로 비밀번호 직접 변경
    const { error } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
      password: newPassword,
    })

    if (error) {
      console.error('[Employee Reset Password] 오류:', error)
      return NextResponse.json(
        { error: `비밀번호 변경 실패: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Employee Reset Password] 오류:', error)
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
