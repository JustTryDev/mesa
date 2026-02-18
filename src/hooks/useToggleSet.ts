import { useState, useCallback } from 'react'

/**
 * useToggleSet - Set<string> 기반 토글 선택 관리 훅
 *
 * 비유: "체크리스트 관리자"와 같습니다.
 * 체크박스를 하나씩 켜고 끄고, 전체선택/해제하는 일을
 * 매번 같은 코드를 반복하지 않고 이 훅 하나로 해결합니다.
 *
 * 사용 예시:
 * const { selected, toggle, toggleAll } = useToggleSet(['item1', 'item2'])
 * // selected.has('item1') → true
 * // toggle('item1') → item1 해제
 * // toggleAll(['item1', 'item2', 'item3']) → 전체선택 또는 전체해제
 */
export function useToggleSet(initialIds: string[] = []) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialIds)
  )

  /** 개별 항목 토글 (체크 ↔ 해제) */
  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  /**
   * 전체 선택/해제
   * - 모든 항목이 이미 선택됨 → 전체 해제
   * - 하나라도 미선택 → 전체 선택
   */
  const toggleAll = useCallback((allIds: string[]) => {
    setSelected((prev) => {
      const allSelected = allIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        allIds.forEach((id) => next.delete(id))
      } else {
        allIds.forEach((id) => next.add(id))
      }
      return next
    })
  }, [])

  /** 전체 초기화 (모든 선택 해제) */
  const clear = useCallback(() => setSelected(new Set()), [])

  /** 상태 복원 (H7: 견적 페이지 뒤로가기 시 이전 선택 상태 복원) */
  const restore = useCallback((ids: string[]) => setSelected(new Set(ids)), [])

  return { selected, toggle, toggleAll, clear, restore }
}
