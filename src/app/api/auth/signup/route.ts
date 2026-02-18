/**
 * 서버사이드 회원가입 API
 * 이메일 OTP 인증 완료 후 호출
 *
 * POST /api/auth/signup
 * Body: { email, password, name, phone, accountType, companyName?, businessNumber?, taxType? }
 *
 * - email_verifications에서 이메일 인증 완료 확인
 * - phone_verifications에서 핸드폰 인증 완료 확인
 * - admin.createUser()로 사용자 생성 (email_confirm: true → Supabase 인증 메일 미발송)
 * - handle_new_customer 트리거가 customers 레코드 자동 생성
 * - phone, company 정보 추가 업데이트
 */
import { NextRequest, NextResponse } from "next/server"
import { sendSignupWelcomeAlimtalk } from "@/lib/sms/kakao-alimtalk"
import { getAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit/helpers"

export async function POST(request: NextRequest) {
  // Rate Limit: 회원가입 스팸 방지 (IP당 시간당 10회)
  const ip = getClientIP(request)
  const rateLimited = await checkRateLimit(ip, "signup")
  if (rateLimited) return rateLimited

  try {
    const {
      email,
      password,
      name,
      phone,
      accountType,
      companyName,
      businessNumber,
      taxType,
      corporateRegistrationNumber,
    } = await request.json()

    // 필수 필드 검증
    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: "필수 정보를 모두 입력해주세요." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. 이메일 인증 완료 확인
    const { data: verification } = await supabase
      .from("email_verifications")
      .select("id, verified")
      .eq("email", email)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!verification) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해주세요." }, { status: 400 })
    }

    // 1-2. 핸드폰 인증 완료 확인
    const cleanPhone = phone.replace(/\D/g, "")
    const { data: phoneVerification } = await supabase
      .from("phone_verifications")
      .select("id, verified")
      .eq("phone", cleanPhone)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!phoneVerification) {
      return NextResponse.json({ error: "연락처 인증을 먼저 완료해주세요." }, { status: 400 })
    }

    // 2. 관리자 사전 등록 고객 확인 (병합 플로우)
    // admin_created 플래그로 관리자가 생성한 고객인지 확인
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    let userId: string
    // auth.users의 user_metadata.admin_created로 사전 등록 여부 확인
    let isAdminCreated = false
    if (existingCustomer) {
      const {
        data: { user: existingUser },
      } = await supabase.auth.admin.getUserById(existingCustomer.id)
      isAdminCreated = existingUser?.user_metadata?.admin_created === true
    }

    if (existingCustomer && isAdminCreated) {
      // 사전 등록 고객 → 비밀번호 설정 + 메타데이터 갱신
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        existingCustomer.id,
        {
          password,
          user_metadata: {
            user_type: "customer",
            invited_as: "customer",
            name,
            phone,
            admin_created: false,
          },
        }
      )

      if (updateAuthError) {
        console.error("[Signup] Auth 업데이트 오류:", updateAuthError)
        return NextResponse.json({ error: "회원가입에 실패했습니다." }, { status: 500 })
      }

      userId = existingCustomer.id
    } else {
      // 신규 가입
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          user_type: "customer",
          invited_as: "customer",
          name,
          phone,
        },
      })

      if (authError) {
        if (
          authError.message.includes("already been registered") ||
          authError.message.includes("already exists")
        ) {
          return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 400 })
        }
        console.error("[Signup] Auth 오류:", authError)
        return NextResponse.json({ error: "회원가입에 실패했습니다." }, { status: 500 })
      }

      userId = authData.user.id
    }

    // 3. customers 테이블 추가 정보 업데이트
    const customerUpdate: Record<string, unknown> = {}
    if (phone) customerUpdate.phones = [{ label: "대표", number: phone }]
    if (isAdminCreated) {
      // 사전 등록 고객: 이름 덮어쓰기
      customerUpdate.name = name
    }

    // 4. 기업 가입 시 회사 처리
    if (accountType === "business" && companyName && businessNumber) {
      const cleanNumber = businessNumber.replace(/[^0-9]/g, "")

      // 기존 회사 조회
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id, name")
        .eq("business_number", cleanNumber)
        .single()

      let companyId: string

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        const { data: newCompany, error: insertError } = await supabase
          .from("companies")
          .insert({
            name: companyName,
            business_number: cleanNumber,
            ...(taxType ? { tax_type: taxType } : {}),
            ...(corporateRegistrationNumber
              ? { corporate_registration_number: corporateRegistrationNumber }
              : {}),
          })
          .select("id")
          .single()

        if (insertError || !newCompany) {
          console.error("[Signup] 회사 생성 오류:", insertError)
          // 사용자는 이미 생성됨 → 회사 연결만 실패
        } else {
          companyId = newCompany.id
        }
      }

      if (companyId!) {
        customerUpdate.company_id = companyId!
      }
    }

    // 5. customers 업데이트
    if (Object.keys(customerUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("customers")
        .update(customerUpdate)
        .eq("id", userId)

      if (updateError) {
        console.error("[Signup] 고객 업데이트 오류:", updateError)
      }
    }

    // 6. 사용된 인증 레코드 정리
    await Promise.all([
      supabase.from("email_verifications").delete().eq("email", email),
      supabase.from("phone_verifications").delete().eq("phone", cleanPhone),
    ])

    // 7. 자동 로그인: 생성된 계정으로 세션 발급
    let session = null
    try {
      const tokenResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      )
      if (tokenResponse.ok) {
        session = await tokenResponse.json()
      }
    } catch (sessionError) {
      // 세션 발급 실패해도 가입은 완료 → 로그인 페이지로 폴백
      console.error("[Signup] 자동 로그인 세션 발급 실패:", sessionError)
    }

    // 8. 회원가입 환영 알림톡 발송 (실패해도 가입 성공에 영향 없음)
    try {
      await sendSignupWelcomeAlimtalk(phone, name)
    } catch {
      // 알림톡 실패는 무시 (로그는 함수 내부에서 기록)
    }

    return NextResponse.json({
      success: true,
      data: { userId, email, session },
    })
  } catch (error) {
    console.error("[Signup] 오류:", error)
    return NextResponse.json({ error: "회원가입 중 오류가 발생했습니다." }, { status: 500 })
  }
}
