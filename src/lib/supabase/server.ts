/**
 * Supabase 서버 클라이언트
 * 서버 컴포넌트, API 라우트에서 사용
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { REMEMBER_ME_COOKIE, SESSION_MAX_AGE } from '@/lib/constants/auth'

// 서버 컴포넌트용 클라이언트 (읽기 전용)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // rememberMe 설정 확인
            const rememberMe = cookieStore.get(REMEMBER_ME_COOKIE)?.value === '1'

            cookiesToSet.forEach(({ name, value, options }) => {
              // 인증 쿠키는 rememberMe에 따라 수명 결정
              const cookieOptions = (name.startsWith('sb-') && name.includes('-auth-token'))
                ? { ...options, maxAge: rememberMe ? SESSION_MAX_AGE : undefined }
                : options
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // 서버 컴포넌트에서는 쿠키 설정이 제한됨
            // 미들웨어에서 세션 갱신 처리
          }
        },
      },
    }
  )
}
