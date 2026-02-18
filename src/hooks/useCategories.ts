/**
 * 카테고리 CRUD 훅
 *
 * 성능 최적화 (2025-02-09):
 * - 카테고리는 공개 데이터이므로 인증 대기 없이 즉시 로드
 * - 이전: AuthContext 완료까지 5초+ 대기 후 fetch
 * - 개선: 마운트 즉시 fetch (1초 미만)
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { isAbortError } from '@/lib/supabase/error-handler'
import type { NoticeCategory, NoticeCategoryInsert, NoticeCategoryUpdate } from '@/types/notice'

interface UseCategoriesReturn {
  categories: NoticeCategory[]
  isLoading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  createCategory: (data: NoticeCategoryInsert) => Promise<NoticeCategory | null>
  updateCategory: (id: string, data: NoticeCategoryUpdate) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  reorderCategories: (orderedIds: string[]) => Promise<boolean>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<NoticeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 성능 최적화: AuthContext 의존성 제거
  // 카테고리는 공개 데이터이므로 인증 상태와 무관하게 즉시 로드

  // 마운트 상태 추적 (AbortError 방지)
  const isMountedRef = useRef(true)

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('notice_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      // 언마운트 후 setState 방지
      if (!isMountedRef.current) return

      if (fetchError) {
        setError(fetchError.message)
        setCategories([])
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      // 언마운트 후 또는 AbortError는 무시
      if (!isMountedRef.current) return
      if (isAbortError(err)) return

      setError(err instanceof Error ? err.message : '카테고리 조회 중 오류 발생')
      setCategories([])
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // 카테고리 생성
  const createCategory = useCallback(async (data: NoticeCategoryInsert): Promise<NoticeCategory | null> => {
    // 현재 최대 sort_order 조회
    const maxOrder = categories.reduce((max, cat) =>
      Math.max(max, cat.sort_order || 0), 0)

    const { data: newCategory, error: createError } = await getSupabase()
      .from('notice_categories')
      .insert({ ...data, sort_order: maxOrder + 1 })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    setCategories(prev => [...prev, newCategory])
    return newCategory
  }, [categories])

  // 카테고리 수정
  const updateCategory = useCallback(async (id: string, data: NoticeCategoryUpdate): Promise<boolean> => {
    const { error: updateError } = await getSupabase()
      .from('notice_categories')
      .update(data)
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, ...data } : cat)
    )
    return true
  }, [])

  // 카테고리 삭제
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await getSupabase()
      .from('notice_categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setCategories(prev => prev.filter(cat => cat.id !== id))
    return true
  }, [])

  // 카테고리 순서 변경 (배치 처리로 최적화)
  const reorderCategories = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    // 로컬 상태 먼저 업데이트 (Optimistic Update)
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
    const reorderedCategories = orderedIds.map((id, index) => ({
      ...categoryMap.get(id)!,
      sort_order: index + 1,
    }))
    setCategories(reorderedCategories)

    // 배치 upsert로 단일 쿼리 실행 (N개 쿼리 → 1개 쿼리)
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }))

    const { error: upsertError } = await getSupabase()
      .from('notice_categories')
      .upsert(updates, { onConflict: 'id' })

    if (upsertError) {
      // 에러 시 원래 상태로 복원
      setError('순서 변경 중 오류가 발생했습니다.')
      setCategories(categories)  // 롤백
      return false
    }

    return true
  }, [categories])

  // 마운트 상태 관리 및 초기 로드
  // 성능 최적화: 카테고리는 공개 데이터이므로 인증 대기 없이 즉시 로드
  // - 이전: authLoading, isUserDataReady 대기 (5초+)
  // - 개선: 마운트 즉시 fetch (1초 미만)
  useEffect(() => {
    isMountedRef.current = true

    // 인증 상태와 무관하게 즉시 카테고리 로드
    fetchCategories()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchCategories])

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  }
}
