/**
 * 고객 연관 회사/수입사 저장 API
 *
 * PATCH /api/admin/customers/entities
 * Body: { customerId, entities: [{ type: 'company'|'importer', id }] }
 *
 * 전체 교체 방식: 기존 연결 삭제 → 새 연결 삽입
 * product_entities 패턴 참고 (src/app/api/admin/products/route.ts)
 */
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { customerId, entities } = await request.json()

    if (!customerId) {
      return apiError('customerId가 필요합니다.')
    }

    const supabaseAdmin = getAdminClient()

    // 기존 연결 전부 삭제
    await supabaseAdmin
      .from('customer_entities')
      .delete()
      .eq('customer_id', customerId)

    // 새 연결 삽입
    if (Array.isArray(entities) && entities.length > 0) {
      const links = entities.map((e: { type: string; id: string }) => ({
        customer_id: customerId,
        entity_type: e.type,
        entity_id: e.id,
      }))

      const { error: linkError } = await supabaseAdmin
        .from('customer_entities')
        .insert(links)

      if (linkError) {
        console.error('[Customer Entities] 연결 저장 오류:', linkError)
        return apiError('연관 회사/수입사 저장 실패', 500)
      }
    }

    // updated_at 갱신
    await supabaseAdmin
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', customerId)

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('[Customer Entities] 오류:', error)
    return apiError('연관 회사/수입사 저장 중 오류', 500)
  }
}
