import { requireEmployee } from '@/lib/auth/api-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError } from '@/lib/api-response'

/**
 * 대시보드 통계 API
 *
 * GET /api/admin/dashboard
 * 직원 수, 고객 수, 공지사항 수를 병렬로 조회합니다.
 */
export async function GET() {
  // 인증 확인
  await requireEmployee()

  const supabase = getAdminClient()

  try {
    // 3개 카운트를 병렬로 조회 (Promise.all로 성능 최적화)
    const [employees, customers, notices] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('notices').select('id', { count: 'exact', head: true }),
    ])

    return apiSuccess({
      employeeCount: employees.count ?? 0,
      customerCount: customers.count ?? 0,
      noticeCount: notices.count ?? 0,
    })
  } catch {
    return apiError('대시보드 데이터 조회에 실패했습니다.', 500)
  }
}
