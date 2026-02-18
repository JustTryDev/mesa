/**
 * 관리자 고객 생성 API
 *
 * POST /api/admin/customers/create
 * Body: { email?, name?, phone?, companyId?, category?, department?, position?, memo?, ... }
 *
 * 두 가지 경로:
 * 1. 이메일 있음: auth.users 생성 → 트리거 → customers 레코드 → 추가 정보 UPDATE
 * 2. 이메일 없음: customers 테이블 직접 INSERT (auth 계정 없이, 코드+구분만으로 생성)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  // 권한 확인 (admin 이상)
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const {
      email, name, phones, companyId, category, department, position,
      projectLink, fax, homepage, cashReceiptNumber, prepaidBalance, points, memo,
      entities, // 연관 회사/수입사: [{ type: 'company'|'importer', id }]
    } = await request.json()

    const supabaseAdmin = getAdminClient()

    // 이메일이 있는 경우: auth 계정 생성 플로우
    if (email && email.trim()) {
      const trimmedEmail = email.trim()

      if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
        return NextResponse.json(
          { error: '유효한 이메일 주소를 입력해주세요.' },
          { status: 400 }
        )
      }

      // 이메일 중복 확인 (customers + employees)
      const [customerCheck, employeeCheck] = await Promise.all([
        supabaseAdmin.from('customers').select('id').eq('email', trimmedEmail).maybeSingle(),
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

      // 임시 비밀번호 생성 (고객은 알 수 없음)
      const randomPassword = crypto.randomBytes(32).toString('hex')

      // auth.users 생성 + admin_created 플래그
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          user_type: 'customer',
          invited_as: 'customer',
          name: name?.trim() || null,
          admin_created: true,
        },
      })

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('exists')) {
          return NextResponse.json(
            { error: '이미 등록된 이메일입니다.' },
            { status: 400 }
          )
        }
        console.error('[Admin Customer Create] Auth 오류:', authError)
        return NextResponse.json(
          { error: '고객 생성에 실패했습니다.' },
          { status: 500 }
        )
      }

      const userId = authData.user.id

      // 트리거가 customers 레코드 생성 후 추가 정보 업데이트
      const updatePayload: Record<string, unknown> = {}
      if (name?.trim()) updatePayload.name = name.trim()
      if (Array.isArray(phones) && phones.length > 0) updatePayload.phones = phones
      if (companyId) updatePayload.company_id = companyId
      if (category) updatePayload.category = category
      if (department) updatePayload.department = department
      if (position) updatePayload.position = position
      if (projectLink) updatePayload.project_link = projectLink
      if (fax) updatePayload.fax = fax
      if (homepage) updatePayload.homepage = homepage
      if (cashReceiptNumber) updatePayload.cash_receipt_number = cashReceiptNumber
      if (prepaidBalance !== undefined) updatePayload.prepaid_balance = prepaidBalance
      if (points !== undefined) updatePayload.points = points
      if (memo) updatePayload.memo = memo

      // 트리거 실행 대기를 위해 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 500))

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('customers')
          .update(updatePayload)
          .eq('id', userId)

        if (updateError) {
          console.error('[Admin Customer Create] 추가 정보 업데이트 오류:', updateError)
        }
      }

      // 연관 회사/수입사 연결
      if (Array.isArray(entities) && entities.length > 0) {
        const links = entities.map((e: { type: string; id: string }) => ({
          customer_id: userId,
          entity_type: e.type,
          entity_id: e.id,
        }))
        const { error: linkError } = await supabaseAdmin
          .from('customer_entities')
          .insert(links)
        if (linkError) {
          console.error('[Admin Customer Create] 엔티티 연결 오류:', linkError)
        }
      }

      return NextResponse.json({
        success: true,
        data: { userId, email: trimmedEmail },
      })
    }

    // 이메일 없는 경우: customers 테이블 직접 INSERT (auth 계정 없음)
    const insertPayload: Record<string, unknown> = {
      id: crypto.randomUUID(),
      // customer_code는 DB DEFAULT(generate_customer_code())로 자동 생성
      // category는 DB DEFAULT('고객')이지만, 명시적으로 전달
      category: category || '고객',
    }

    if (name?.trim()) insertPayload.name = name.trim()
    if (email?.trim()) insertPayload.email = email.trim()
    if (Array.isArray(phones) && phones.length > 0) insertPayload.phones = phones
    if (companyId) insertPayload.company_id = companyId
    if (department) insertPayload.department = department
    if (position) insertPayload.position = position
    if (projectLink) insertPayload.project_link = projectLink
    if (fax) insertPayload.fax = fax
    if (homepage) insertPayload.homepage = homepage
    if (cashReceiptNumber) insertPayload.cash_receipt_number = cashReceiptNumber
    if (prepaidBalance !== undefined) insertPayload.prepaid_balance = prepaidBalance
    if (points !== undefined) insertPayload.points = points
    if (memo) insertPayload.memo = memo

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert(insertPayload)
      .select('id, customer_code')
      .single()

    if (insertError) {
      console.error('[Admin Customer Create] 직접 INSERT 오류:', insertError)
      return NextResponse.json(
        { error: '고객 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 연관 회사/수입사 연결
    if (Array.isArray(entities) && entities.length > 0) {
      const links = entities.map((e: { type: string; id: string }) => ({
        customer_id: insertData.id,
        entity_type: e.type,
        entity_id: e.id,
      }))
      const { error: linkError } = await supabaseAdmin
        .from('customer_entities')
        .insert(links)
      if (linkError) {
        console.error('[Admin Customer Create] 엔티티 연결 오류:', linkError)
      }
    }

    return NextResponse.json({
      success: true,
      data: { userId: insertData.id, customerCode: insertData.customer_code },
    })
  } catch (error) {
    console.error('[Admin Customer Create] 오류:', error)
    return NextResponse.json(
      { error: '고객 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
