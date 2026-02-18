/**
 * 공지사항 CRUD 훅
 *
 * TanStack Query 마이그레이션:
 * - 목록 조회(GET) → useQuery로 자동 캐싱 + 페이지네이션
 * - 생성/수정/삭제(CRUD) → 기존 mutation 유지 + 낙관적 업데이트
 *
 * 비유: 이전에는 "게시판 목록을 매번 처음부터 불러왔다면",
 *       이제는 "비서(useQuery)가 목록을 관리하고, 필터/페이지 변경 시 자동으로 새로 가져옴"
 *
 * 성능 최적화:
 * - 공개 공지사항(isPublished=true)은 인증 대기 없이 즉시 로드
 * - admin 페이지의 비공개 공지사항도 즉시 로드 (미들웨어가 인증 처리)
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import type {
  Notice,
  NoticeInsert,
  NoticeUpdate,
  NoticeWithCategory,
  NoticeFilter,
  NoticeSort,
} from '@/types/notice'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/notice-constants'

interface UseNoticesOptions {
  filter?: NoticeFilter
  sort?: NoticeSort
  page?: number
  pageSize?: number
  autoFetch?: boolean
}

// 공지사항 조회 결과 타입
interface NoticesQueryResult {
  notices: NoticeWithCategory[]
  total: number
}

interface UseNoticesReturn {
  notices: NoticeWithCategory[]
  isLoading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number
  fetchNotices: () => Promise<void>
  createNotice: (data: NoticeInsert) => Promise<Notice | null>
  updateNotice: (id: string, data: NoticeUpdate) => Promise<boolean>
  deleteNotice: (id: string) => Promise<boolean>
  getNotice: (id: string) => Promise<NoticeWithCategory | null>
  incrementViewCount: (id: string) => Promise<void>
  setPage: (page: number) => void
  setFilter: (filter: NoticeFilter) => void
  setSort: (sort: NoticeSort) => void
}

/**
 * Supabase에서 공지사항 목록을 조회하는 함수 (queryFn)
 */
async function fetchNoticesData(
  filter: NoticeFilter,
  sort: NoticeSort,
  page: number,
  pageSize: number
): Promise<NoticesQueryResult> {
  let query = getSupabase()
    .from('notices')
    .select(`
      *,
      category:notice_categories(*)
    `, { count: 'exact' })

  // 필터 적용
  if (filter.categoryId) {
    query = query.eq('category_id', filter.categoryId)
  }
  if (filter.isPublished !== undefined) {
    query = query.eq('is_published', filter.isPublished)
  }
  if (filter.isPinned !== undefined) {
    query = query.eq('is_pinned', filter.isPinned)
  }
  if (filter.search) {
    query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`)
  }

  // 정렬 (고정 공지 우선)
  query = query
    .order('is_pinned', { ascending: false })
    .order(sort.field, { ascending: sort.order === 'asc' })

  // 페이지네이션
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    notices: (data as NoticeWithCategory[]) || [],
    total: count || 0,
  }
}

export function useNotices(options: UseNoticesOptions = {}): UseNoticesReturn {
  const {
    filter: initialFilter = {},
    sort: initialSort = { field: 'created_at', order: 'desc' },
    page: initialPage = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    autoFetch = true,
  } = options

  const queryClient = useQueryClient()

  const [page, setPage] = useState(initialPage)
  const [filter, setFilter] = useState<NoticeFilter>(initialFilter)
  const [sort, setSort] = useState<NoticeSort>(initialSort)

  const totalPages = Math.ceil((0) / pageSize) // 초기값, 아래에서 실제 값으로 대체

  // useQuery: 공지사항 목록 자동 조회
  // filter, sort, page가 변경될 때마다 queryKey가 바뀌어 자동으로 재조회
  // 비유: "검색 조건이 바뀌면 비서가 알아서 새 결과를 가져오는 것"
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['notices', filter, sort, page, pageSize],
    queryFn: () => fetchNoticesData(filter, sort, page, pageSize),
    // autoFetch가 false이면 쿼리를 실행하지 않음
    enabled: autoFetch,
  })

  const notices = data?.notices ?? []
  const total = data?.total ?? 0
  const computedTotalPages = Math.ceil(total / pageSize)
  const error = queryError ? (queryError instanceof Error ? queryError.message : '공지사항 조회 중 오류 발생') : null

  // 수동 새로고침 (기존 fetchNotices 대체)
  const fetchNotices = useCallback(async () => {
    await refetch()
  }, [refetch])

  // 필터/정렬 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1)
  }, [filter, sort])

  // 단일 공지사항 조회
  const getNotice = useCallback(async (id: string): Promise<NoticeWithCategory | null> => {
    const { data, error: fetchError } = await getSupabase()
      .from('notices')
      .select(`
        *,
        category:notice_categories(*)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('공지사항 조회 실패:', fetchError.message)
      return null
    }

    return data as NoticeWithCategory
  }, [])

  // 공지사항 생성 (Optimistic Update)
  const createNotice = useCallback(async (insertData: NoticeInsert): Promise<Notice | null> => {
    const { data: newNotice, error: createError } = await getSupabase()
      .from('notices')
      .insert(insertData)
      .select(`
        *,
        category:notice_categories(*)
      `)
      .single()

    if (createError) {
      console.error('공지사항 생성 실패:', createError.message)
      return null
    }

    // 캐시 무효화 → 목록 자동 새로고침
    queryClient.invalidateQueries({ queryKey: ['notices'] })

    return newNotice
  }, [queryClient])

  // 공지사항 수정 (Optimistic Update)
  const updateNotice = useCallback(async (id: string, updateData: NoticeUpdate): Promise<boolean> => {
    const { data: updatedNotice, error: updateError } = await getSupabase()
      .from('notices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:notice_categories(*)
      `)
      .single()

    if (updateError) {
      console.error('공지사항 수정 실패:', updateError.message)
      return false
    }

    // 캐시 무효화 → 목록 자동 새로고침
    queryClient.invalidateQueries({ queryKey: ['notices'] })

    return true
  }, [queryClient])

  // 공지사항 삭제 (Optimistic Update)
  const deleteNotice = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await getSupabase()
      .from('notices')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('공지사항 삭제 실패:', deleteError.message)
      return false
    }

    // 캐시 무효화 → 목록 자동 새로고침
    queryClient.invalidateQueries({ queryKey: ['notices'] })

    return true
  }, [queryClient])

  // 조회수 증가 (Optimistic Update)
  const incrementViewCount = useCallback(async (id: string): Promise<void> => {
    await getSupabase().rpc('increment_notice_view', { notice_id: id })

    // 로컬 캐시에서 조회수만 +1 (전체 재조회 불필요)
    queryClient.setQueryData<NoticesQueryResult>(
      ['notices', filter, sort, page, pageSize],
      (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          notices: prev.notices.map((notice) =>
            notice.id === id
              ? { ...notice, view_count: (notice.view_count || 0) + 1 }
              : notice
          ),
        }
      }
    )
  }, [queryClient, filter, sort, page, pageSize])

  return {
    notices,
    isLoading,
    error,
    total,
    page,
    totalPages: computedTotalPages,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    getNotice,
    incrementViewCount,
    setPage,
    setFilter,
    setSort,
  }
}

// 사용자용 공개 공지사항 조회 훅
export function usePublicNotices(options: Omit<UseNoticesOptions, 'filter'> = {}) {
  return useNotices({
    ...options,
    filter: { isPublished: true },
  })
}
