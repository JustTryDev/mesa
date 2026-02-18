/**
 * 다건 선택(체크박스) 관리 커스텀 훅
 *
 * 비유: 이메일함에서 여러 메일을 체크박스로 선택해서
 * "읽음 처리", "삭제" 같은 작업을 한꺼번에 하는 것과 같습니다.
 *
 * @example
 * ```tsx
 * const { selectedOrders, toggleSelect, selectAll, deselectAll, isSelected, selectedCount } =
 *   useBulkSelection()
 *
 * // 체크박스 클릭
 * <input checked={isSelected('order123')} onChange={() => toggleSelect('order123', '1688')} />
 *
 * // 전체 선택
 * selectAll(orders.map(o => ({ orderId: o.orderId, platform: o.platform })))
 *
 * // 일괄 처리 후 초기화
 * deselectAll()
 * ```
 */

import { useState, useCallback, useMemo } from 'react'

// 선택된 주문 정보
export interface SelectedOrder {
  orderId: string
  platform: '1688' | 'alibaba.com'
}

export default function useBulkSelection() {
  // Map<orderId, SelectedOrder> — 주문 ID를 키로 사용
  const [selectedMap, setSelectedMap] = useState<Map<string, SelectedOrder>>(new Map())

  // 개별 토글: 체크/해제
  const toggleSelect = useCallback((orderId: string, platform: '1688' | 'alibaba.com') => {
    setSelectedMap(prev => {
      const next = new Map(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.set(orderId, { orderId, platform })
      }
      return next
    })
  }, [])

  // 전체 선택: 현재 페이지의 모든 주문을 선택
  const selectAll = useCallback((orders: SelectedOrder[]) => {
    setSelectedMap(prev => {
      const next = new Map(prev)
      for (const order of orders) {
        next.set(order.orderId, order)
      }
      return next
    })
  }, [])

  // 전체 해제
  const deselectAll = useCallback(() => {
    setSelectedMap(new Map())
  }, [])

  // 특정 주문이 선택되었는지 확인
  const isSelected = useCallback((orderId: string) => {
    return selectedMap.has(orderId)
  }, [selectedMap])

  // 현재 페이지의 주문이 모두 선택되었는지 확인
  const isAllSelected = useCallback((orderIds: string[]) => {
    if (orderIds.length === 0) return false
    return orderIds.every(id => selectedMap.has(id))
  }, [selectedMap])

  // 전체 선택/해제 토글
  const toggleSelectAll = useCallback((orders: SelectedOrder[]) => {
    const allIds = orders.map(o => o.orderId)
    const allCurrentlySelected = allIds.length > 0 && allIds.every(id => selectedMap.has(id))

    if (allCurrentlySelected) {
      // 현재 페이지 주문만 해제 (다른 페이지 선택은 유지)
      setSelectedMap(prev => {
        const next = new Map(prev)
        for (const id of allIds) {
          next.delete(id)
        }
        return next
      })
    } else {
      selectAll(orders)
    }
  }, [selectedMap, selectAll])

  // 선택된 주문 목록 (배열)
  const selectedOrders = useMemo(
    () => Array.from(selectedMap.values()),
    [selectedMap]
  )

  // 선택된 주문 수
  const selectedCount = selectedMap.size

  return {
    selectedOrders,
    selectedCount,
    toggleSelect,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    toggleSelectAll,
  }
}
