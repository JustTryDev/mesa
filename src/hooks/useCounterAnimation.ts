'use client'

import { useState, useEffect } from 'react'

/**
 * 카운터 애니메이션 훅 (Counter Animation Hook)
 * 0부터 목표 숫자까지 부드럽게 증가하는 애니메이션
 *
 * @param target - 목표 숫자
 * @param duration - 애니메이션 지속 시간 (ms)
 * @param startAnimation - 애니메이션 시작 여부
 *
 * @example
 * const count = useCounterAnimation(1000, 2000, isVisible)
 * // isVisible이 true가 되면 0에서 1000까지 2초 동안 증가
 */
export function useCounterAnimation(
  target: number,
  duration: number = 2000,
  startAnimation: boolean = false
) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    // 이미 애니메이션이 실행됐거나 시작 조건이 아닌 경우 return
    if (!startAnimation || hasAnimated) return

    setHasAnimated(true)
    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // EaseOutQuad 이징 효과
      // 처음엔 빠르고 끝으로 갈수록 느려지는 자연스러운 움직임
      const easedProgress = progress * (2 - progress)
      const currentValue = Math.floor(easedProgress * target)

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target) // 최종값 보장
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration, startAnimation, hasAnimated])

  return count
}
