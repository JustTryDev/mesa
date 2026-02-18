'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { isAbortError } from '@/lib/supabase/error-handler'
import { REMEMBER_ME_COOKIE, SESSION_MAX_AGE, getProjectRef } from '@/lib/constants/auth'

/**
 * 쿠키에서 Supabase 세션을 직접 파싱
 * @supabase/ssr의 getSession()이 타임아웃될 때 폴백으로 사용
 */
function getSessionFromCookie(): { session: Session | null; user: User | null } {
  if (typeof document === 'undefined') {
    return { session: null, user: null }
  }

  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('sb-') && c.includes('-auth-token='))

    if (!authCookie) {
      return { session: null, user: null }
    }

    const cookieValue = authCookie.split('=').slice(1).join('=').trim()

    // base64- 접두사 제거
    const base64Value = cookieValue.startsWith('base64-')
      ? cookieValue.replace('base64-', '')
      : cookieValue

    // 빈 값이면 무시 (깨진 쿠키)
    if (!base64Value) {
      return { session: null, user: null }
    }

    const decoded = atob(base64Value)
    if (!decoded || !decoded.startsWith('{')) {
      return { session: null, user: null }
    }

    const tokenData = JSON.parse(decoded)

    // 토큰 만료 확인
    if (tokenData.expires_at && Date.now() / 1000 > tokenData.expires_at) {
      console.warn('[AuthContext] 쿠키의 세션이 만료됨')
      return { session: null, user: null }
    }

    // Session 객체 구성
    const session: Session = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'bearer',
      expires_in: tokenData.expires_in || 3600,
      expires_at: tokenData.expires_at,
      user: tokenData.user as User,
    }

    return { session, user: tokenData.user as User }
  } catch (err) {
    console.error('[AuthContext] 쿠키 파싱 오류:', err)
    return { session: null, user: null }
  }
}

/**
 * 쿠키에서 액세스 토큰만 추출
 */
function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('sb-') && c.includes('-auth-token='))

    if (!authCookie) return null

    const cookieValue = authCookie.split('=').slice(1).join('=').trim()
    const base64Value = cookieValue.startsWith('base64-')
      ? cookieValue.replace('base64-', '')
      : cookieValue

    const decoded = atob(base64Value)
    const tokenData = JSON.parse(decoded)

    // 만료 확인
    if (tokenData.expires_at && Date.now() / 1000 > tokenData.expires_at) {
      return null
    }

    return tokenData.access_token || null
  } catch {
    return null
  }
}

// Supabase 환경 변수 (직접 fetch에 사용)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * 타임아웃을 적용한 getSession 호출
 * 타임아웃 시 쿠키에서 직접 세션 파싱
 *
 * 성능 최적화: 기본 타임아웃을 1초로 줄임 (이전 3초)
 * - 네트워크가 느려도 쿠키 폴백으로 빠르게 처리
 * - 사용자 경험 개선 (5초 → 1초 내외)
 */
async function getSessionWithTimeout(
  supabase: ReturnType<typeof getSupabase>,
  timeoutMs: number = 1000  // 3000 → 1000ms로 단축
): Promise<{ session: Session | null; user: User | null }> {
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), timeoutMs)
    )

    const { data } = await Promise.race([sessionPromise, timeoutPromise])
    return { session: data.session, user: data.session?.user ?? null }
  } catch {
    // 타임아웃 또는 기타 오류 시 쿠키에서 직접 파싱
    console.warn('[AuthContext] getSession 타임아웃, 쿠키에서 직접 파싱 시도')
    return getSessionFromCookie()
  }
}

/**
 * 직원 정보 타입
 */
export interface Employee {
  id: string
  email: string
  name: string
  phones: { label: string; number: string }[] | null
  department: string | null
  position: string | null
  role: 'super_admin' | 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 고객 정보 타입
 */
export interface Customer {
  id: string
  customer_code: string
  email: string
  name: string
  phone: string | null
  company_id: string | null
  category: string | null
  department: string | null
  position: string | null
  project_link: string | null
  fax: string | null
  homepage: string | null
  cash_receipt_number: string | null
  contract_documents: unknown[]
  prepaid_balance: number
  points: number
  memo: string | null
  updated_at: string
}

/**
 * 메뉴 권한 타입
 */
export interface MenuPermission {
  menu_id: string
  can_access: boolean
}

/**
 * Auth Context 타입
 */
interface AuthContextType {
  // 상태
  user: User | null
  session: Session | null
  employee: Employee | null
  customer: Customer | null
  menuPermissions: MenuPermission[]
  isLoading: boolean
  isUserDataReady: boolean  // 사용자 데이터(employee/customer) 로드 완료 여부
  error: string | null

  // 계산된 값
  userType: 'employee' | 'customer' | null
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  isStaff: boolean
  isActive: boolean

  // 메서드
  hasMenuAccess: (menuId: string) => boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ========================================
// TanStack Query 키 상수
// ========================================
// 쿼리 키는 "택배 주소"와 같음:
// 같은 주소(키)로 보내면 같은 캐시 데이터를 받음
// 주소가 다르면(userId가 다르면) 다른 데이터를 받음
const AUTH_QUERY_KEYS = {
  // 사용자 프로필 데이터 (직원 + 고객 + 권한)
  userProfile: (userId: string) => ['auth', 'userProfile', userId] as const,
} as const

// ========================================
// 사용자 프로필 데이터 타입
// ========================================
// useQuery가 한 번에 가져올 데이터 묶음
// 비유: 택배 한 상자에 직원 정보, 고객 정보, 메뉴 권한을 모두 담아서 배달
interface UserProfileData {
  employee: Employee | null
  customer: Customer | null
  menuPermissions: MenuPermission[]
}

// ========================================
// 사용자 프로필 조회 함수 (queryFn)
// ========================================
// useQuery가 "데이터를 어떻게 가져올지" 알려주는 함수
// 비유: 레스토랑에서 주문(queryKey)을 받으면 실제로 요리하는 셰프
async function fetchUserProfile(userId: string): Promise<UserProfileData> {
  const accessToken = getAccessTokenFromCookie()

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  }

  // 직원/고객 정보 병렬 조회 (Promise.all = 동시에 요리 시작)
  const [employeeRes, customerRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers,
    }),
    fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers,
    }),
  ])

  // 직원 정보 파싱
  let employee: Employee | null = null
  if (employeeRes.ok) {
    const empData = await employeeRes.json()
    if (Array.isArray(empData) && empData.length > 0) {
      employee = empData[0] as Employee
    }
  }

  // 고객 정보 파싱
  let customer: Customer | null = null
  if (customerRes.ok) {
    const custData = await customerRes.json()
    if (Array.isArray(custData) && custData.length > 0) {
      customer = custData[0] as Customer
    }
  }

  // 직원이고 staff인 경우에만 메뉴 권한 추가 조회
  let menuPermissions: MenuPermission[] = []
  if (employee?.role === 'staff') {
    try {
      const permRes = await fetch(
        `${SUPABASE_URL}/rest/v1/employee_menu_permissions?employee_id=eq.${userId}&select=menu_id,can_access`,
        { method: 'GET', headers }
      )
      if (permRes.ok) {
        const permData = await permRes.json()
        if (Array.isArray(permData)) {
          menuPermissions = permData as MenuPermission[]
        }
      }
    } catch (err) {
      console.error('메뉴 권한 조회 오류:', err)
    }
  }

  return { employee, customer, menuPermissions }
}

/**
 * Auth Provider
 * 전역 인증 상태 관리
 *
 * TanStack Query 마이그레이션:
 * - 기존: useState + useCallback(fetchEmployee/fetchCustomer/fetchMenuPermissions) + 수동 refreshUser
 * - 개선: useQuery로 사용자 프로필 데이터를 자동 캐싱/갱신
 *
 * 비유: 기존에는 매번 직접 가게에 가서 물건을 사왔다면 (수동 fetch),
 * 이제는 정기배송 서비스에 가입한 것 (useQuery가 자동으로 데이터를 가져오고 캐싱)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ========================================
  // 인증 세션 상태 (Supabase Auth 이벤트 기반)
  // ========================================
  // session/user는 Supabase의 onAuthStateChange로 관리되므로 useState 유지
  // 이유: onAuthStateChange는 실시간 이벤트라서 useQuery로 변환하기 어려움
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  // 마운트 상태 추적 (AbortError 방지)
  const isMountedRef = useRef(true)

  // storage 이벤트 핸들러에서 최신 상태 참조용 ref
  const userRef = useRef<User | null>(null)
  const sessionRef = useRef<Session | null>(null)

  // TanStack Query 클라이언트 (캐시 무효화에 사용)
  const queryClient = useQueryClient()

  // ========================================
  // useQuery: 사용자 프로필 데이터 조회
  // ========================================
  // 비유: "내 프로필 정보를 자동으로 가져와줘" 라고 주문을 넣어둔 것
  // - user?.id가 있으면 자동으로 fetchUserProfile 호출
  // - user?.id가 없으면 (로그아웃 상태) 쿼리를 실행하지 않음 (enabled: false)
  // - 결과는 캐시되어 같은 userId면 네트워크 요청 없이 즉시 반환
  const {
    data: profileData,       // 조회된 사용자 프로필 데이터
    isLoading: isProfileLoading,  // 최초 로딩 중 여부
    error: profileError,     // 에러 객체
  } = useQuery({
    // 쿼리 키: userId가 바뀌면 자동으로 새 데이터 조회
    queryKey: AUTH_QUERY_KEYS.userProfile(user?.id ?? ''),
    // 실제 데이터 조회 함수
    queryFn: () => fetchUserProfile(user!.id),
    // user가 있을 때만 쿼리 실행 (로그아웃 상태에서는 비활성화)
    enabled: !!user?.id,
    // 인증 데이터는 5분간 신선한 것으로 간주
    // (5분 내 같은 요청이 오면 서버에 다시 물어보지 않음)
    staleTime: 5 * 60 * 1000,
    // 캐시는 10분간 유지 (탭 전환 시 즉시 표시 후 백그라운드 갱신)
    gcTime: 10 * 60 * 1000,
    // 에러 시 1번만 재시도
    retry: 1,
    // 창 포커스 시 자동 갱신 비활성화 (onAuthStateChange가 이미 처리)
    refetchOnWindowFocus: false,
  })

  // useQuery 결과에서 개별 값 추출
  // 비유: 택배 상자를 열어서 각각의 물건을 꺼내는 것
  const employee = profileData?.employee ?? null
  const customer = profileData?.customer ?? null
  // useMemo로 래핑: profileData가 변하지 않으면 같은 배열 참조를 유지
  // → hasMenuAccess, useMemo(value) 등의 의존성이 불필요하게 변하지 않음
  const menuPermissions = useMemo(
    () => profileData?.menuPermissions ?? [],
    [profileData?.menuPermissions]
  )

  // ========================================
  // 로딩 상태 계산
  // ========================================
  // 기존 인터페이스 호환: isLoading, isUserDataReady

  // 초기 세션 확인이 아직 안 된 경우를 추적
  const [isSessionChecked, setIsSessionChecked] = useState(false)

  // isLoading: 세션 확인 전이거나, 프로필 최초 로딩 중
  const isLoading = !isSessionChecked || (!!user?.id && isProfileLoading)

  // isUserDataReady: 사용자 데이터 로드가 완료됨
  // - 세션 확인 완료 + (로그아웃이거나 프로필 로딩이 끝남)
  const isUserDataReady = isSessionChecked && (!user?.id || !isProfileLoading)

  // error: 프로필 조회 에러 메시지
  const error = profileError
    ? (profileError instanceof Error ? profileError.message : '사용자 정보를 불러오는데 실패했습니다.')
    : null

  // ========================================
  // refreshUser: 사용자 프로필 강제 갱신
  // ========================================
  // 기존 인터페이스 호환: refreshUser()를 호출하면 최신 데이터로 갱신
  // 비유: "캐시 무시하고 지금 당장 새 데이터 가져와!" 라고 요청하는 것
  const refreshUser = useCallback(async () => {
    if (!isMountedRef.current) return

    // 쿠키에서 최신 사용자 정보 확인
    const { session: currentSession, user: currentUser } = getSessionFromCookie()
    setSession(currentSession)
    setUser(currentUser)

    if (currentUser?.id) {
      // invalidateQueries: 해당 키의 캐시를 "만료됨"으로 표시 → 자동으로 새로 조회
      // 비유: "이 택배 상자 유통기한 지났어!" → TanStack Query가 알아서 새 상자를 주문
      await queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEYS.userProfile(currentUser.id),
      })
    }
  }, [queryClient])

  /**
   * 로그아웃
   * 타임아웃 처리, 쿠키 삭제, 클라이언트 초기화 포함
   */
  const signOut = useCallback(async () => {
    const supabase = getSupabase()

    try {
      // signOut에 5초 타임아웃 적용
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 5000)
      )

      await Promise.race([signOutPromise, timeoutPromise])
    } catch (err) {
      // 타임아웃 또는 기타 오류 시 수동으로 쿠키 삭제
      console.warn('signOut 오류, 수동 쿠키 삭제 실행:', err)

      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const cookieName = cookie.split('=')[0].trim()
          if (cookieName.startsWith('sb-')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
          }
        }
        // rememberMe 쿠키도 삭제
        document.cookie = `${REMEMBER_ME_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    }

    // Supabase 클라이언트 싱글톤 초기화 (만료된 세션 정보 제거)
    if (typeof window !== 'undefined') {
      delete window.__supabaseClient
    }

    // 상태 초기화
    setUser(null)
    setSession(null)

    // TanStack Query 캐시 전체 제거 (로그아웃이므로 모든 인증 데이터 무효)
    queryClient.removeQueries({ queryKey: ['auth'] })
  }, [queryClient])

  /**
   * 메뉴 접근 권한 확인
   */
  const hasMenuAccess = useCallback((menuId: string): boolean => {
    // 직원이 아니면 접근 불가
    if (!employee) return false

    // 비활성 직원은 접근 불가
    if (!employee.is_active) return false

    // super_admin, admin은 전체 접근 가능
    if (employee.role === 'super_admin' || employee.role === 'admin') {
      return true
    }

    // staff는 권한 테이블 확인
    const permission = menuPermissions.find(p => p.menu_id === menuId)
    return permission?.can_access ?? false
  }, [employee, menuPermissions])

  // user, session 상태를 ref로 동기화 (storage 이벤트 핸들러에서 사용)
  useEffect(() => {
    userRef.current = user
    sessionRef.current = session
  }, [user, session])

  // ========================================
  // 초기 세션 확인 및 인증 상태 변경 감지
  // ========================================
  useEffect(() => {
    // 마운트 상태 설정
    isMountedRef.current = true

    const supabase = getSupabase()

    // 성능 최적화: 쿠키에서 즉시 세션 파싱 (네트워크 대기 없음)
    const { session: currentSession, user: currentUser } = getSessionFromCookie()

    setSession(currentSession)
    setUser(currentUser)
    // 세션 확인 완료 표시 → isLoading 계산에 사용
    setIsSessionChecked(true)

    // 인증 상태 변경 감지 (Supabase Realtime 이벤트)
    // 비유: 은행에서 "계좌에 입출금이 있으면 문자 보내줘"라고 알림 설정한 것
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMountedRef.current) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // 토큰 갱신 시 rememberMe 설정에 맞게 쿠키 재설정
          if (event === 'TOKEN_REFRESHED' && newSession) {
            const rememberMe = document.cookie.includes(`${REMEMBER_ME_COOKIE}=1`)
            const projectRef = getProjectRef()
            const sessionData = {
              access_token: newSession.access_token,
              refresh_token: newSession.refresh_token,
              expires_at: newSession.expires_at,
              expires_in: newSession.expires_in,
              token_type: newSession.token_type,
              user: newSession.user,
            }
            const encodedSession = btoa(JSON.stringify(sessionData))

            if (rememberMe) {
              document.cookie = `sb-${projectRef}-auth-token=base64-${encodedSession}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`
            } else {
              document.cookie = `sb-${projectRef}-auth-token=base64-${encodedSession}; path=/; SameSite=Lax`
            }
          }

          // TanStack Query 캐시 무효화 → 자동으로 최신 프로필 조회
          // 비유: "로그인했으니까 내 정보 다시 가져와!" 라는 알림
          if (newSession?.user?.id) {
            queryClient.invalidateQueries({
              queryKey: AUTH_QUERY_KEYS.userProfile(newSession.user.id),
            }).catch(err => {
              if (isAbortError(err)) return
              console.error('사용자 정보 갱신 오류:', err)
            })
          }
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 인증 관련 캐시 모두 제거
          queryClient.removeQueries({ queryKey: ['auth'] })
        }
      }
    )

    return () => {
      // 언마운트 상태로 설정
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  // 탭 간 세션 동기화를 위한 storage 이벤트 리스너 (별도 useEffect)
  // 의존성 배열을 빈 배열로 설정하여 리스너가 한 번만 등록되도록 함
  useEffect(() => {
    if (typeof window === 'undefined') return

    const supabase = getSupabase()

    const handleStorageChange = (event: StorageEvent) => {
      if (!isMountedRef.current) return

      // Supabase 세션 키 변경 감지 (sb-로 시작하는 키)
      if (event.key?.startsWith('sb-') && event.key?.includes('-auth-token')) {
        // 세션 변경 시 상태 새로고침 (타임아웃 및 쿠키 폴백 적용)
        getSessionWithTimeout(supabase, 3000).then(({ session: newSession, user: newUser }) => {
          if (!isMountedRef.current) return

          // ref를 사용하여 최신 상태와 비교
          const hasSessionChanged =
            (newUser?.id !== userRef.current?.id) ||
            (!!newSession !== !!sessionRef.current)

          if (hasSessionChanged) {
            setSession(newSession)
            setUser(newUser)

            if (newUser) {
              // 탭 동기화: 캐시 무효화로 최신 데이터 조회
              queryClient.invalidateQueries({
                queryKey: AUTH_QUERY_KEYS.userProfile(newUser.id),
              }).catch(err => {
                if (isAbortError(err)) return
                console.error('탭 동기화 중 사용자 정보 갱신 오류:', err)
              })
            } else {
              // 다른 탭에서 로그아웃됨 → 캐시 제거
              queryClient.removeQueries({ queryKey: ['auth'] })
            }
          }
        }).catch((err) => {
          if (isAbortError(err)) return
          console.error('탭 동기화 오류:', err)
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열: 리스너는 한 번만 등록

  // 커스텀 'auth-session-changed' 이벤트 리스너
  // 로그인 페이지에서 쿠키 저장 후 이 이벤트를 발생시켜 즉시 갱신 요청
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSessionChanged = () => {
      if (!isMountedRef.current) return
      // refreshUser를 호출하여 쿠키에서 최신 세션 확인 후 캐시 무효화
      refreshUser().catch(err => {
        if (isAbortError(err)) return
        console.error('[AuthContext] 세션 변경 후 갱신 오류:', err)
      })
    }

    window.addEventListener('auth-session-changed', handleSessionChanged)

    return () => {
      window.removeEventListener('auth-session-changed', handleSessionChanged)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열: 리스너는 한 번만 등록

  // 계산된 값
  const userType = employee ? 'employee' : customer ? 'customer' : null
  const isAuthenticated = !!user
  const isSuperAdmin = employee?.role === 'super_admin'
  const isAdmin = employee?.role === 'admin' || isSuperAdmin
  const isStaff = employee?.role === 'staff'
  const isActive = employee?.is_active ?? (customer ? true : false)

  // useMemo로 value 객체를 메모이제이션
  // → AuthProvider의 부모가 리렌더링되어도, 실제 인증 상태가 변하지 않았으면
  //   하위 컴포넌트들이 불필요하게 리렌더링되지 않음
  // 일상생활 비유: 우체부가 편지를 가져올 때, 내용이 같으면 같은 편지로 취급
  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    employee,
    customer,
    menuPermissions,
    isLoading,
    isUserDataReady,
    error,
    userType,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isActive,
    hasMenuAccess,
    refreshUser,
    signOut,
  }), [
    user,
    session,
    employee,
    customer,
    menuPermissions,
    isLoading,
    isUserDataReady,
    error,
    userType,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isActive,
    hasMenuAccess,
    refreshUser,
    signOut,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Auth Context 사용 훅
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
