/**
 * 공개 데이터 조회 전용 Supabase 클라이언트
 *
 * 비유: 도서관 로비의 무료 게시판 — 회원증(쿠키) 없이 누구나 볼 수 있음
 *
 * 일반 서버 클라이언트(createClient from server.ts)는 내부에서 cookies()를 호출하기 때문에
 * Next.js가 해당 페이지를 "동적"으로 판단합니다. (= 매 요청마다 새로 렌더링)
 *
 * 이 클라이언트는 cookies()를 사용하지 않으므로:
 * - Next.js 정적 생성(ISR)과 호환됩니다
 * - RLS가 "누구나 읽기 허용"인 테이블(예: homepage_sections)에만 사용하세요
 * - 인증이 필요한 데이터에는 사용하지 마세요
 */
import { createClient } from "@supabase/supabase-js"

export function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
