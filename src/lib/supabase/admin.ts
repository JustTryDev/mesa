/**
 * Supabase 관리자 클라이언트 (Service Role Key)
 *
 * API Route에서 RLS를 우회하여 DB에 접근할 때 사용합니다.
 * 절대 클라이언트(브라우저)에서 사용하지 마세요.
 *
 * 기존에 64개 파일에서 각각 정의되어 있던 getAdminClient / getSupabaseClient를
 * 이 파일 하나로 통합했습니다.
 */
import { createClient } from '@supabase/supabase-js'

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
