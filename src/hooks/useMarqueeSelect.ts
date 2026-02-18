/**
 * useMarqueeSelect - 마키(러버밴드) 드래그 선택 훅
 *
 * Windows 탐색기처럼 빈 공간에서 마우스를 드래그하면
 * 파란색 선택 사각형이 나타나고, 걸치는 파일들이 자동 선택됩니다.
 *
 * DnD 충돌 방지:
 * - 카드 위 클릭 → DnD가 처리 (마키 시작 안 함)
 * - 빈 공간 클릭 → 마키가 처리 (DnD 리스너 없음)
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ========================================
// 타입 정의
// ========================================

/** 마키 사각형 (컨테이너 내 절대 좌표) */
export interface MarqueeRect {
  x: number
  y: number
  width: number
  height: number
}

/** 캐시된 카드 위치 정보 */
interface CachedCard {
  fileId: string
  isFolder: boolean
  x: number
  y: number
  width: number
  height: number
}

interface UseMarqueeSelectOptions {
  /** 스크롤 컨테이너 ref */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** 선택 상태 업데이트 (파일 ID 배열) */
  onSelectionChange: (fileIds: string[]) => void
  /** DnD 활성 상태 (true이면 마키 비활성화) */
  isDndActive: boolean
}

// ========================================
// AABB 교차 판정
// ========================================

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

// ========================================
// 자동 스크롤 설정
// ========================================

/** 컨테이너 상하 경계에서 자동 스크롤이 시작되는 거리 (px) */
const AUTO_SCROLL_ZONE = 50
/** 자동 스크롤 속도 (px/frame) */
const AUTO_SCROLL_SPEED = 8
/** 마키 시작으로 판정하는 최소 드래그 거리 (px) */
const MIN_DRAG_DISTANCE = 4

// ========================================
// 훅 본체
// ========================================

export function useMarqueeSelect({
  containerRef,
  onSelectionChange,
  isDndActive,
}: UseMarqueeSelectOptions) {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null)

  // 내부 상태 (ref로 관리 - 리렌더링 없이 빠르게 업데이트)
  const isTracking = useRef(false)
  const startPoint = useRef({ x: 0, y: 0 })
  const cachedCards = useRef<CachedCard[]>([])
  const rafId = useRef<number>(0)
  const lastSelectedIds = useRef<string[]>([])
  const autoScrollRafId = useRef<number>(0)

  /** 카드 위치를 컨테이너 내 절대 좌표로 캐싱 */
  const cacheCardPositions = useCallback(() => {
    const container = containerRef.current
    if (!container) return []

    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const cards = container.querySelectorAll('[data-file-id]')

    return Array.from(cards).map((card) => {
      const rect = card.getBoundingClientRect()
      return {
        fileId: card.getAttribute('data-file-id')!,
        isFolder: card.getAttribute('data-is-folder') === 'true',
        // 뷰포트 좌표 → 컨테이너 내 절대 좌표
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top + scrollTop,
        width: rect.width,
        height: rect.height,
      }
    })
  }, [containerRef])

  /** 마우스 좌표를 컨테이너 내 절대 좌표로 변환 */
  const toContainerCoords = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top + container.scrollTop,
    }
  }, [containerRef])

  /** 자동 스크롤 처리 */
  const handleAutoScroll = useCallback((clientY: number) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const relY = clientY - rect.top

    if (relY < AUTO_SCROLL_ZONE) {
      // 상단 근처 → 위로 스크롤
      const ratio = 1 - relY / AUTO_SCROLL_ZONE
      container.scrollTop -= AUTO_SCROLL_SPEED * ratio
    } else if (relY > rect.height - AUTO_SCROLL_ZONE) {
      // 하단 근처 → 아래로 스크롤
      const ratio = (relY - (rect.height - AUTO_SCROLL_ZONE)) / AUTO_SCROLL_ZONE
      container.scrollTop += AUTO_SCROLL_SPEED * ratio
    }
  }, [containerRef])

  /** 마키 사각형 계산 + 교차 판정 */
  const updateSelection = useCallback((clientX: number, clientY: number) => {
    const current = toContainerCoords(clientX, clientY)
    const start = startPoint.current

    // 사각형 계산 (음수 방향 드래그 지원)
    const rect: MarqueeRect = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    }

    setMarqueeRect(rect)

    // 교차하는 파일 카드 필터 (폴더 제외)
    const intersecting = cachedCards.current
      .filter((card) => !card.isFolder && rectsIntersect(rect, card))
      .map((card) => card.fileId)

    // 변경된 경우만 콜백 호출 (불필요한 리렌더링 방지)
    const prev = lastSelectedIds.current
    if (
      intersecting.length !== prev.length ||
      intersecting.some((id, i) => id !== prev[i])
    ) {
      lastSelectedIds.current = intersecting
      onSelectionChange(intersecting)
    }
  }, [toContainerCoords, onSelectionChange])

  // ========================================
  // 이벤트 핸들러
  // ========================================

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isTracking.current) return

    // 최소 드래그 거리 확인
    const start = startPoint.current
    const current = toContainerCoords(e.clientX, e.clientY)
    const dist = Math.hypot(current.x - start.x, current.y - start.y)

    if (dist < MIN_DRAG_DISTANCE) return

    // RAF throttle
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      handleAutoScroll(e.clientY)
      updateSelection(e.clientX, e.clientY)
    })
  }, [toContainerCoords, handleAutoScroll, updateSelection])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isTracking.current) return
    isTracking.current = false

    // RAF 정리
    cancelAnimationFrame(rafId.current)
    cancelAnimationFrame(autoScrollRafId.current)

    // 드래그 거리 확인
    const start = startPoint.current
    const end = toContainerCoords(e.clientX, e.clientY)
    const dist = Math.hypot(end.x - start.x, end.y - start.y)

    if (dist < MIN_DRAG_DISTANCE) {
      // 빈 공간 클릭 (드래그 아닌 경우) → 전체 선택 해제
      onSelectionChange([])
    }

    setMarqueeRect(null)
    lastSelectedIds.current = []

    // 이벤트 리스너 해제
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [toContainerCoords, onSelectionChange, handleMouseMove])

  /** 컨테이너 mousedown 핸들러 */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // 좌클릭만 처리
    if (e.button !== 0) return

    // DnD 활성 중이면 무시
    if (isDndActive) return

    // 카드 위에서 클릭한 경우 무시 (DnD가 처리)
    const target = e.target as HTMLElement
    if (target.closest('[data-file-id]')) return

    // 버튼, 인풋 등 인터랙티브 요소 위에서는 무시
    if (target.closest('button, input, [role="button"]')) return

    // 텍스트 선택 방지
    e.preventDefault()

    // 시작점 기록
    startPoint.current = toContainerCoords(e.clientX, e.clientY)
    isTracking.current = true
    lastSelectedIds.current = []

    // 카드 위치 캐싱
    cachedCards.current = cacheCardPositions()

    // window 레벨 이벤트 리스너 등록
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [isDndActive, toContainerCoords, cacheCardPositions, handleMouseMove, handleMouseUp])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafId.current)
      cancelAnimationFrame(autoScrollRafId.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return {
    /** 마키 사각형 (null이면 비활성) */
    marqueeRect,
    /** 컨테이너에 바인딩할 props */
    containerProps: {
      onMouseDown,
    },
  }
}
