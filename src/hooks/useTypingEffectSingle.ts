'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * 단일 문자열 타이핑 효과 훅
 * 텍스트가 타자기처럼 한 글자씩 나타나는 효과를 만듭니다.
 *
 * 특징:
 * - 한 번 완료된 텍스트는 다시 활성화될 때 즉시 완료 상태로 표시
 * - 모바일에서 빠른 스크롤 시에도 안정적으로 동작
 *
 * @param text - 타이핑할 텍스트
 * @param speed - 타이핑 속도 (ms 단위, 기본값: 80)
 * @param startTyping - 타이핑 시작 여부 (기본값: true)
 * @returns { displayedText, isComplete }
 *
 * @example
 * const { displayedText, isComplete } = useTypingEffectSingle(
 *   "안녕하세요",
 *   80,
 *   true
 * )
 */
export function useTypingEffectSingle(
  text: string,
  speed: number = 80,
  startTyping: boolean = true
): { displayedText: string; isComplete: boolean } {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  // 한 번 완료된 텍스트는 추적하여 재방문 시 즉시 표시
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    // 이미 완료된 경우, 다시 활성화되면 즉시 완료 상태로
    if (startTyping && hasPlayedRef.current) {
      setDisplayedText(text)
      setIsComplete(true)
      return
    }

    // 타이핑이 시작되지 않았으면 상태 유지 (리셋하지 않음)
    if (!startTyping) {
      return
    }

    let index = 0
    setDisplayedText("")
    setIsComplete(false)

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        hasPlayedRef.current = true // 완료 표시
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, startTyping])

  return { displayedText, isComplete }
}
