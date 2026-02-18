/**
 * UI 설정 범용 훅 (Supabase DB 저장)
 *
 * 모달 레이아웃, 테이블 칼럼 설정 등 사용자별 UI 설정을
 * Supabase user_ui_settings 테이블에 저장/로드/리셋합니다.
 *
 * 사용 예:
 * const { data, save, reset } = useUserUISetting<TableSettings>('table_columns', 'companies')
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { getSessionItem, setSessionItem, removeSessionItem } from '@/lib/storage'

// 세션 캐시 키 접두사
const CACHE_PREFIX = 'ui_setting'

// 캐시 키 생성
function getCacheKey(settingType: string, settingKey: string): string {
  return `${CACHE_PREFIX}_${settingType}_${settingKey}`
}

export interface UseUserUISettingReturn<T> {
  /** DB에서 로드된 설정 (없으면 null) */
  data: T | null
  /** 로딩 중 여부 */
  isLoading: boolean
  /** DB에 설정 저장 (upsert) */
  save: (data: T) => Promise<void>
  /** DB에서 삭제 (기본값으로 복원) */
  reset: () => Promise<void>
  /** 저장/삭제 중 여부 */
  isSaving: boolean
}

/**
 * UI 설정 저장/로드 범용 훅
 * @param settingType - 설정 유형 ('modal_layout' | 'table_columns' 등)
 * @param settingKey - 설정 키 (모달: 'company-form', 테이블: 'companies' 등)
 */
export function useUserUISetting<T>(
  settingType: string,
  settingKey: string
): UseUserUISettingReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 현재 사용자 ID 참조 (save/reset에서 사용)
  const userIdRef = useRef<string | null>(null)
  // 중복 로드 방지
  const loadedKeyRef = useRef<string | null>(null)

  // 마운트 시 DB에서 로드
  useEffect(() => {
    const cacheKey = getCacheKey(settingType, settingKey)

    // 같은 키로 이미 로드했으면 스킵
    if (loadedKeyRef.current === cacheKey) return
    loadedKeyRef.current = cacheKey

    const load = async () => {
      setIsLoading(true)

      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setData(null)
          setIsLoading(false)
          return
        }

        userIdRef.current = user.id

        // sessionStorage 캐시 확인
        const cached = getSessionItem<T | null>(cacheKey, null)
        if (cached !== null) {
          setData(cached)
          setIsLoading(false)
          return
        }

        // DB에서 로드
        const { data: row } = await supabase
          .from('user_ui_settings')
          .select('setting_data')
          .eq('user_id', user.id)
          .eq('setting_type', settingType)
          .eq('setting_key', settingKey)
          .single()

        if (row?.setting_data) {
          const settingData = row.setting_data as T
          setData(settingData)
          // sessionStorage에 캐시
          setSessionItem(cacheKey, settingData)
        } else {
          setData(null)
        }
      } catch {
        // 네트워크 오류 등 → null (기본값 사용)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [settingType, settingKey])

  // DB에 저장 (upsert)
  const save = useCallback(async (newData: T) => {
    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setData(newData)

    const cacheKey = getCacheKey(settingType, settingKey)
    setSessionItem(cacheKey, newData)

    if (!userIdRef.current) {
      // 사용자 ID 재확인
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) userIdRef.current = user.id
      } catch {
        return
      }
    }

    if (!userIdRef.current) return

    setIsSaving(true)
    try {
      const supabase = getSupabase()
      await supabase
        .from('user_ui_settings')
        .upsert(
          {
            user_id: userIdRef.current,
            setting_type: settingType,
            setting_key: settingKey,
            setting_data: newData as unknown as Record<string, unknown>,
          },
          { onConflict: 'user_id,setting_type,setting_key' }
        )
    } catch (err) {
      console.error('[useUserUISetting] 저장 실패:', err)
    } finally {
      setIsSaving(false)
    }
  }, [settingType, settingKey])

  // DB에서 삭제 (기본값으로 복원)
  const reset = useCallback(async () => {
    setData(null)

    const cacheKey = getCacheKey(settingType, settingKey)
    removeSessionItem(cacheKey)

    if (!userIdRef.current) return

    setIsSaving(true)
    try {
      const supabase = getSupabase()
      await supabase
        .from('user_ui_settings')
        .delete()
        .eq('user_id', userIdRef.current)
        .eq('setting_type', settingType)
        .eq('setting_key', settingKey)
    } catch (err) {
      console.error('[useUserUISetting] 삭제 실패:', err)
    } finally {
      setIsSaving(false)
    }
  }, [settingType, settingKey])

  return { data, isLoading, save, reset, isSaving }
}

export default useUserUISetting
