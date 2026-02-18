/**
 * 인증 관련 상수
 */

// rememberMe 설정 저장용 쿠키 이름
export const REMEMBER_ME_COOKIE = 'app-remember-me'

// 쿠키 수명 (초 단위) - 7일
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

// Supabase 프로젝트 ref 추출
export function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
}
