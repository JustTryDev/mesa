/**
 * Supabase 브라우저 클라이언트
 * 클라이언트 컴포넌트에서 사용
 *
 * 세션 관리 전략:
 * 1. 쿠키에서 세션 토큰 읽기 (미들웨어가 갱신)
 * 2. localStorage에 기록 (SDK가 동기적으로 읽기)
 * 3. SDK의 autoRefreshToken으로 자동 갱신
 *
 * 주의: global.headers에 access_token을 고정하면 안 됨
 *       → 만료 후에도 계속 사용되어 401 발생
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// 전역 싱글톤 인스턴스 (window 객체에 저장하여 HMR에서도 유지)
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
  }
}

// 환경변수 확인
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // 빌드 타임에는 경고만 출력하고 null 반환
    if (typeof window === 'undefined') {
      console.warn('Supabase 환경변수가 설정되지 않았습니다.')
      return null
    }
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return { url, anonKey }
}

/**
 * Supabase URL에서 프로젝트 레퍼런스 추출
 * 예: https://gjkpxpqdodbvhjoagryz.supabase.co → gjkpxpqdodbvhjoagryz
 */
function getProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0]
  } catch {
    return ''
  }
}

/**
 * 쿠키에서 Supabase 세션 토큰 추출
 */
function getSessionFromCookie(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof document === 'undefined') {
    return { accessToken: null, refreshToken: null }
  }

  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('sb-') && c.includes('-auth-token='))

    if (!authCookie) {
      return { accessToken: null, refreshToken: null }
    }

    const cookieValue = authCookie.split('=').slice(1).join('=').trim()
    const base64Value = cookieValue.startsWith('base64-')
      ? cookieValue.replace('base64-', '')
      : cookieValue

    const decoded = atob(base64Value)
    const tokenData = JSON.parse(decoded)

    // 만료 여부와 관계없이 토큰 반환
    // → SDK의 autoRefreshToken이 자동 갱신 처리
    return {
      accessToken: tokenData.access_token || null,
      refreshToken: tokenData.refresh_token || null
    }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

/**
 * 쿠키 세션을 localStorage에 기록
 * SDK가 클라이언트 생성 시 동기적으로 읽을 수 있도록 사전 기록
 * → global.headers 대신 이 방식으로 세션 전달
 */
function seedLocalStorage(url: string, accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return

  try {
    const projectRef = getProjectRef(url)
    if (!projectRef) return

    const storageKey = `sb-${projectRef}-auth-token`

    // 이미 localStorage에 세션이 있으면 덮어쓰지 않음
    // (SDK가 이미 갱신한 새 토큰을 보존)
    const existing = window.localStorage.getItem(storageKey)
    if (existing) {
      try {
        const parsed = JSON.parse(existing)
        // refresh_token이 같으면 기존 것이 더 최신일 수 있음 (SDK가 갱신했을 수 있음)
        if (parsed.refresh_token === refreshToken) return
      } catch {
        // 파싱 실패 시 덮어씀
      }
    }

    // SDK가 읽을 수 있는 형식으로 세션 기록
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    }
    window.localStorage.setItem(storageKey, JSON.stringify(session))
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// 지연 초기화된 클라이언트 getter (HMR에서도 싱글톤 유지)
export function getSupabase(): SupabaseClient {
  // 브라우저 환경에서 window에 저장된 인스턴스 확인
  if (typeof window !== 'undefined' && window.__supabaseClient) {
    return window.__supabaseClient
  }

  const config = getSupabaseConfig()
  if (!config) {
    throw new Error('Supabase 클라이언트를 생성할 수 없습니다.')
  }

  // 쿠키에서 세션 토큰 읽기
  const { accessToken, refreshToken } = getSessionFromCookie()

  // 쿠키 세션을 localStorage에 사전 기록
  // → SDK가 createClient 시 동기적으로 읽어 세션 복원
  if (accessToken && refreshToken) {
    seedLocalStorage(config.url, accessToken, refreshToken)
  }

  // SDK 클라이언트 생성
  // ⚠️ global.headers에 Authorization을 설정하면 안 됨!
  //    → 만료된 토큰이 고정되어 SDK의 자동 갱신이 무시됨
  const client = createSupabaseClient(config.url, config.anonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  // localStorage에 세션이 없거나 기록 실패한 경우를 위한 폴백
  // setSession으로 SDK에 직접 세션 전달 (비동기, 자동 갱신 포함)
  if (refreshToken) {
    client.auth.setSession({
      access_token: accessToken || '',
      refresh_token: refreshToken
    }).catch(err => {
      console.warn('[Supabase] 세션 설정 실패:', err)
    })
  }

  // 인증 상태 변경 시 싱글톤 초기화 (로그아웃/세션 만료 대응)
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        delete window.__supabaseClient
      }
    })
  }

  // 브라우저 환경에서 window에 저장
  if (typeof window !== 'undefined') {
    window.__supabaseClient = client
  }

  return client
}

// createClient는 getSupabase의 별칭으로 유지 (호환성)
export function createClient(): SupabaseClient {
  return getSupabase()
}

// 편의를 위한 기본 클라이언트 export (getter 함수 사용 권장)
export const supabase = {
  get client() {
    return getSupabase()
  }
}
