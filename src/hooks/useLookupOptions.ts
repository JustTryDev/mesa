/**
 * 룩업 테이블에서 옵션을 가져오는 재사용 훅
 *
 * shipping_methods, order_types, customs_clearance_methods 등
 * name + sort_order 구조의 테이블에서 드롭다운 옵션을 로드합니다.
 *
 * TanStack Query로 자동 캐싱 + 재조회를 처리합니다.
 * 비유: 이전에는 "메모장(Map 캐시)"에 직접 적고 지우던 것을
 *       "비서(TanStack Query)"가 알아서 관리해주는 방식으로 변경
 *
 * @example
 * const { options, isLoading } = useLookupOptions('shipping_methods')
 * // options = [{ value: '3PL 경유', label: '3PL 경유' }, ...]
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { getQueryClient } from '@/components/providers/QueryProvider'

interface SelectOption {
  value: string
  label: string
}

/**
 * 룩업 테이블에서 옵션을 조회하는 함수 (queryFn으로 사용)
 * Supabase에서 name + sort_order 순으로 데이터를 가져옴
 */
async function fetchLookupOptions(tableName: string): Promise<SelectOption[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(tableName)
    .select('name')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data || []).map(row => ({
    value: row.name,
    label: row.name,
  }))
}

export default function useLookupOptions(tableName: string) {
  // useQuery가 자동으로 처리하는 것들:
  // 1. 캐싱 (이전의 전역 Map 캐시 대체)
  // 2. 로딩 상태 (이전의 useState + setIsLoading 대체)
  // 3. 언마운트 시 안전한 상태 업데이트 (이전의 mountedRef 대체)
  // 4. 동일 tableName에 대한 중복 요청 방지 (자동 dedup)
  const { data, isLoading } = useQuery({
    // queryKey: 이 데이터의 "주소" 같은 것
    // ['lookup-options', 'shipping_methods'] → shipping_methods 테이블의 옵션
    queryKey: ['lookup-options', tableName],
    queryFn: () => fetchLookupOptions(tableName),
    // staleTime은 QueryProvider에서 전역 60초로 설정됨
    // → 60초 내 같은 tableName 요청은 캐시에서 바로 반환
  })

  // 기존 반환 인터페이스 유지 (호출부가 깨지지 않도록)
  return {
    options: data ?? [],
    isLoading,
  }
}

/**
 * 캐시 무효화 (옵션 추가/수정/삭제 후 호출)
 *
 * 비유: "비서야, 이 메모장 내용 오래됐으니 다시 확인해줘"
 * → TanStack Query가 해당 queryKey의 데이터를 "stale(오래됨)" 상태로 표시
 * → 다음 번 해당 데이터가 필요할 때 자동으로 서버에서 다시 가져옴
 *
 * @param tableName 특정 테이블만 무효화. 생략하면 모든 룩업 캐시 무효화
 */
export function invalidateLookupCache(tableName?: string) {
  const queryClient = getQueryClient()

  if (tableName) {
    // 특정 테이블만 무효화
    queryClient.invalidateQueries({ queryKey: ['lookup-options', tableName] })
  } else {
    // 모든 룩업 옵션 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['lookup-options'] })
  }
}
