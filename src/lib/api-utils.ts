/**
 * API 라우트 공용 유틸리티
 *
 * 식당에서 주문표를 받을 때 "테이블 번호, 메뉴, 수량"을 항상 같은 양식으로 적듯이,
 * API에서 "몇 페이지, 몇 개, 정렬 방향"을 항상 같은 양식으로 파싱합니다.
 *
 * 기존에 17개 API에서 6가지 다른 방식으로 파싱하던 것을 이 함수 하나로 통일합니다.
 */

export interface PaginationParams {
  page: number
  pageSize: number
  search: string
  sortField: string
  sortDir: 'asc' | 'desc'
}

/**
 * URL 쿼리 파라미터에서 페이지네이션 정보 파싱
 *
 * @param searchParams - URL 쿼리 파라미터
 * @param defaults - 기본값 (선택)
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: Partial<PaginationParams> = {}
): PaginationParams {
  const {
    page: defaultPage = 1,
    pageSize: defaultPageSize = 20,
    search: defaultSearch = '',
    sortField: defaultSortField = 'created_at',
    sortDir: defaultSortDir = 'desc',
  } = defaults

  // sortDir / sortDirection / direction 세 가지 파라미터명을 모두 지원
  const rawDir =
    searchParams.get('sortDir') ||
    searchParams.get('sortDirection') ||
    searchParams.get('direction') ||
    defaultSortDir
  const sortDir = rawDir === 'asc' ? 'asc' : 'desc'

  return {
    // 최소 1페이지
    page: Math.max(1, Number(searchParams.get('page')) || defaultPage),
    // 1~100 범위로 제한 (너무 큰 값 방지)
    pageSize: Math.min(
      100,
      Math.max(
        1,
        Number(
          searchParams.get('pageSize') ||
          searchParams.get('limit') ||
          searchParams.get('perPage')
        ) || defaultPageSize
      )
    ),
    // search / query 두 가지 파라미터명 지원
    search:
      searchParams.get('search') ||
      searchParams.get('query') ||
      defaultSearch,
    sortField:
      searchParams.get('sortField') ||
      searchParams.get('sort') ||
      defaultSortField,
    sortDir,
  }
}
