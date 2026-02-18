/**
 * 플로팅 가로 스크롤바 훅
 *
 * 테이블 영역과 플로팅 스크롤바 간 양방향 스크롤 동기화를 처리한다.
 * 수입 주문 관리(OrderListTable)의 인라인 로직을 공용 훅으로 추출.
 *
 * 사용법:
 *   const { scrollContainerRef, floatingScrollRef, tableScrollWidth } = useFloatingScrollbar()
 *   <div ref={scrollContainerRef} className="overflow-auto scrollbar-hide">
 *     <table>...</table>
 *   </div>
 *   <FloatingScrollbar scrollRef={floatingScrollRef} width={tableScrollWidth} />
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export function useFloatingScrollbar(isLoading?: boolean) {
  // 테이블 스크롤 영역 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // 플로팅 스크롤바 ref
  const floatingScrollRef = useRef<HTMLDivElement>(null)
  // 테이블의 전체 가로 크기 (scrollWidth)
  const [tableScrollWidth, setTableScrollWidth] = useState(0)

  // 1) 테이블 scrollWidth 측정 (ResizeObserver로 자동 추적)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollWidth = () => {
      setTableScrollWidth(container.scrollWidth)
    }
    updateScrollWidth()

    const observer = new ResizeObserver(updateScrollWidth)
    observer.observe(container)
    if (container.firstElementChild) {
      observer.observe(container.firstElementChild)
    }

    return () => observer.disconnect()
  }, [isLoading])

  // 2) 테이블 ↔ 플로팅 스크롤바 양방향 동기화
  useEffect(() => {
    const container = scrollContainerRef.current
    const floating = floatingScrollRef.current
    if (!container || !floating) return

    let syncing = false

    // 테이블 스크롤 → 플로팅 스크롤바 동기화
    const onContainerScroll = () => {
      if (syncing) return
      syncing = true
      floating.scrollLeft = container.scrollLeft
      syncing = false
    }

    // 플로팅 스크롤바 → 테이블 동기화
    const onFloatingScroll = () => {
      if (syncing) return
      syncing = true
      container.scrollLeft = floating.scrollLeft
      syncing = false
    }

    container.addEventListener('scroll', onContainerScroll)
    floating.addEventListener('scroll', onFloatingScroll)

    return () => {
      container.removeEventListener('scroll', onContainerScroll)
      floating.removeEventListener('scroll', onFloatingScroll)
    }
  }, [tableScrollWidth])

  return { scrollContainerRef, floatingScrollRef, tableScrollWidth }
}
