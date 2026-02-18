/**
 * 관리자 고객 이메일 변경 API
 *
 * PATCH /api/admin/customers/update-email
 * Body: { customerId, newEmail }
 *
 * - auth.users에 존재하면 auth + customers 모두 업데이트
 * - auth.users에 없으면 (이메일 없이 생성된 고객) customers만 업데이트
 * - 이메일 중복 체크 (customers + employees)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { customerId, newEmail } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 제거(빈 값) 또는 변경
    const trimmedEmail = newEmail?.trim() || null

    if (trimmedEmail && !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // 이메일 중복 확인 (변경하는 경우만)
    if (trimmedEmail) {
      const [customerCheck, employeeCheck] = await Promise.all([
        supabaseAdmin.from('customers').select('id').eq('email', trimmedEmail).neq('id', customerId).maybeSingle(),
        supabaseAdmin.from('employees').select('id').eq('email', trimmedEmail).maybeSingle(),
      ])

      if (customerCheck.data) {
        return NextResponse.json(
          { error: '이미 등록된 고객 이메일입니다.' },
          { status: 400 }
        )
      }

      if (employeeCheck.data) {
        return NextResponse.json(
          { error: '직원으로 등록된 이메일입니다.' },
          { status: 400 }
        )
      }
    }

    // auth.users 존재 여부 확인 및 업데이트
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(customerId)

    if (authUser?.user) {
      // auth.users에 존재 → auth 이메일도 업데이트
      if (trimmedEmail) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          customerId,
          { email: trimmedEmail }
        )

        if (authError) {
          console.error('[Update Email] Auth 업데이트 오류:', authError)
          return NextResponse.json(
            { error: '이메일 변경에 실패했습니다.' },
            { status: 500 }
          )
        }
      }
    }

    // customers 테이블 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        email: trimmedEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('[Update Email] DB 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '이메일 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Update Email] 오류:', error)
    return NextResponse.json(
      { error: '이메일 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
