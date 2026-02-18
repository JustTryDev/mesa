/**
 * 어드민 사이트 설정 API
 *
 * GET /api/admin/site-settings — 설정 조회
 * PUT /api/admin/site-settings — 설정 수정
 *
 * admin 이상 권한 필요
 *
 * 비유: 회사 명함 정보를 수정할 수 있는 총무부 창구
 */

import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/api-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { invalidateSiteSettingsCache } from "@/lib/site-settings"

/** 설정 조회 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .single()

    if (error) {
      return apiError(`설정 조회 실패: ${error.message}`, 500)
    }

    return apiSuccess({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return apiError(`설정 조회 중 오류: ${message}`, 500)
  }
}

/** 설정 수정 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const body = await request.json()

    // id, created_at, updated_at은 수정 불가 (서버에서 관리)
    const { id: _id, created_at: _ca, updated_at: _ua, ...updateData } = body

    const supabase = getAdminClient()

    // upsert: 행이 없으면 생성, 있으면 업데이트
    const { data, error } = await supabase
      .from("site_settings")
      .upsert({ id: "default", ...updateData }, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      return apiError(`설정 저장 실패: ${error.message}`, 500)
    }

    // 서버 캐시 초기화 (다음 조회 시 DB에서 새로 가져옴)
    invalidateSiteSettingsCache()

    return apiSuccess({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return apiError(`설정 저장 중 오류: ${message}`, 500)
  }
}
