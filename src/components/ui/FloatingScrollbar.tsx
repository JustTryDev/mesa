/**
 * 플로팅 가로 스크롤바 컴포넌트
 *
 * 테이블 하단에 항상 보이는 노란색 가로 스크롤바.
 * useFloatingScrollbar 훅과 함께 사용한다.
 *
 * 사용법:
 *   <FloatingScrollbar scrollRef={floatingScrollRef} width={tableScrollWidth} />
 */

'use client'

import { RefObject } from 'react'
import { cn } from '@/lib/utils'

interface FloatingScrollbarProps {
  /** useFloatingScrollbar 훅에서 반환된 ref */
  scrollRef: RefObject<HTMLDivElement | null>
  /** 테이블의 전체 가로 크기 (scrollWidth) */
  width: number
  className?: string
}

export function FloatingScrollbar({ scrollRef, width, className }: FloatingScrollbarProps) {
  // 스크롤이 필요 없으면 표시하지 않음
  if (width <= 0) return null

  return (
    <div
      ref={scrollRef}
      className={cn(
        'shrink-0 z-10 overflow-x-scroll floating-scrollbar',
        'bg-gray-100 border-t border-gray-300',
        className,
      )}
      style={{ height: 16 }}
    >
      {/* 테이블과 동일한 너비의 더미 div → 스크롤바 생성 */}
      <div style={{ width, height: 1 }} />
    </div>
  )
}
