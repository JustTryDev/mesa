/**
 * 관리자 고객 삭제 API
 *
 * DELETE /api/admin/customers/delete
 * Body: { customerId }
 *
 * - admin.deleteUser()로 auth 계정 삭제
 * - FK CASCADE로 customers 레코드 자동 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  // 권한 확인 (admin 이상)
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // 고객 존재 확인
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, name, email')
      .eq('id', customerId)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // auth.users 삭제 → CASCADE로 customers 레코드도 삭제
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(customerId)

    if (deleteError) {
      console.error('[Admin Customer Delete] 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: `고객 삭제에 실패했습니다: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Customer Delete] 오류:', error)
    return NextResponse.json(
      { error: '고객 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
