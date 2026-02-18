/**
 * API 라우트 인증 헬퍼
 * 서버 사이드에서 사용자 인증 및 권한 확인
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 직원 역할 타입
 */
export type EmployeeRole = 'super_admin' | 'admin' | 'staff'

/**
 * 인증된 직원 정보
 */
export interface AuthenticatedEmployee {
  id: string
  email: string
  name: string
  role: EmployeeRole
  is_active: boolean
}

/**
 * 인증된 고객 정보
 */
export interface AuthenticatedCustomer {
  id: string
  email: string
  name: string
  company_id: string | null
  customer_code: string
}

/**
 * 인증 결과 타입
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

/**
 * 에러 응답 생성 헬퍼
 */
function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * 직원 인증 필수
 * API 라우트에서 인증된 직원만 접근 가능하도록 검증
 *
 * @param requiredRoles - 필요한 역할 배열 (선택사항, 미지정 시 모든 활성 직원 허용)
 * @param menuId - 메뉴 ID (선택사항, staff의 메뉴 권한 확인용)
 *
 * @example
 * // 모든 활성 직원 허용
 * const auth = await requireEmployee()
 *
 * @example
 * // admin 이상만 허용
 * const auth = await requireEmployee(['super_admin', 'admin'])
 *
 * @example
 * // 특정 메뉴 권한 확인
 * const auth = await requireEmployee(undefined, 'alibaba-orders')
 */
export async function requireEmployee(
  requiredRoles?: EmployeeRole[],
  menuId?: string
): Promise<AuthResult<AuthenticatedEmployee>> {
  const supabase = await createClient()

  // 1. 세션 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      response: errorResponse('인증이 필요합니다.', 401),
    }
  }

  // 2. 직원 정보 조회
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, email, name, role, is_active')
    .eq('id', user.id)
    .single()

  if (empError || !employee) {
    return {
      success: false,
      response: errorResponse('직원 전용 API입니다.', 403),
    }
  }

  // 3. 활성화 상태 확인
  if (!employee.is_active) {
    return {
      success: false,
      response: errorResponse('계정이 비활성화되어 있습니다.', 403),
    }
  }

  // 4. 역할 확인 (requiredRoles가 지정된 경우)
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(employee.role)) {
      return {
        success: false,
        response: errorResponse('권한이 부족합니다.', 403),
      }
    }
  }

  // 5. 메뉴 권한 확인 (menuId가 지정된 경우, staff만 확인)
  if (menuId && employee.role === 'staff') {
    const { data: permission } = await supabase
      .from('employee_menu_permissions')
      .select('can_access')
      .eq('employee_id', employee.id)
      .eq('menu_id', menuId)
      .single()

    if (!permission?.can_access) {
      return {
        success: false,
        response: errorResponse('이 메뉴에 대한 접근 권한이 없습니다.', 403),
      }
    }
  }

  return {
    success: true,
    data: employee as AuthenticatedEmployee,
  }
}

/**
 * 고객 인증 필수
 * API 라우트에서 인증된 고객만 접근 가능하도록 검증
 *
 * @example
 * const auth = await requireCustomer()
 * if (!auth.success) return auth.response
 */
export async function requireCustomer(): Promise<AuthResult<AuthenticatedCustomer>> {
  const supabase = await createClient()

  // 1. 세션 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      response: errorResponse('인증이 필요합니다.', 401),
    }
  }

  // 2. 고객 정보 조회
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, email, name, company_id, customer_code')
    .eq('id', user.id)
    .single()

  if (custError || !customer) {
    return {
      success: false,
      response: errorResponse('고객 전용 API입니다.', 403),
    }
  }

  return {
    success: true,
    data: customer as AuthenticatedCustomer,
  }
}

/**
 * 인증 확인 (직원 또는 고객)
 * 로그인만 확인하고 유형은 구분하지 않음
 *
 * @example
 * const auth = await requireAuth()
 * if (!auth.success) return auth.response
 */
export async function requireAuth(): Promise<
  AuthResult<{ id: string; email: string; userType: 'employee' | 'customer' }>
> {
  const supabase = await createClient()

  // 1. 세션 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      response: errorResponse('인증이 필요합니다.', 401),
    }
  }

  // 2. 직원 확인
  const { data: employee } = await supabase
    .from('employees')
    .select('id, is_active')
    .eq('id', user.id)
    .single()

  if (employee && employee.is_active) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email!,
        userType: 'employee',
      },
    }
  }

  // 3. 고객 확인
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', user.id)
    .single()

  if (customer) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email!,
        userType: 'customer',
      },
    }
  }

  return {
    success: false,
    response: errorResponse('유효하지 않은 계정입니다.', 403),
  }
}

/**
 * super_admin 전용
 * 가장 높은 권한이 필요한 API에서 사용
 */
export async function requireSuperAdmin(): Promise<AuthResult<AuthenticatedEmployee>> {
  return requireEmployee(['super_admin'])
}

/**
 * admin 이상 전용
 * 관리자 기능이 필요한 API에서 사용
 */
export async function requireAdmin(): Promise<AuthResult<AuthenticatedEmployee>> {
  return requireEmployee(['super_admin', 'admin'])
}
