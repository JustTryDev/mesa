'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * 인터섹션 옵저버 훅 (Intersection Observer Hook)
 * 요소가 뷰포트에 진입했는지 감지
 *
 * @param threshold - 요소가 얼마나 보여야 트리거할지 (0~1)
 * @returns ref와 isVisible 상태
 *
 * @example
 * const { ref, isVisible } = useIntersectionObserver(0.3)
 * // ref를 div에 연결하면, 30% 이상 보일 때 isVisible이 true가 됨
 */
export function useIntersectionObserver(threshold: number = 0.2) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // 한 번 보이면 더 이상 관찰하지 않음 (성능 최적화)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
