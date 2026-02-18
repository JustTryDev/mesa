'use client'

import { useState, useEffect } from 'react'

/**
 * 타이핑 효과 훅 (Typing Effect Hook)
 * 텍스트 배열을 순차적으로 타이핑하는 효과를 구현
 *
 * @param texts - 타이핑할 텍스트 배열
 * @param typingSpeed - 한 글자당 타이핑 속도 (ms)
 * @param startDelay - 시작 전 지연 시간 (ms)
 *
 * @example
 * const { displayTexts, currentIndex, isComplete } = useTypingEffect(
 *   ['첫 번째 문장', '두 번째 문장'],
 *   80,
 *   500
 * )
 */
export function useTypingEffect(
  texts: string[],
  typingSpeed: number = 80,
  startDelay: number = 500
) {
  // 각 텍스트별 현재 표시 상태
  const [displayTexts, setDisplayTexts] = useState<string[]>(texts.map(() => ''))
  // 현재 타이핑 중인 텍스트 인덱스
  const [currentIndex, setCurrentIndex] = useState(0)
  // 현재 텍스트에서 타이핑 중인 글자 인덱스
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  // 모든 타이핑 완료 여부
  const [isComplete, setIsComplete] = useState(false)
  // 타이핑 시작 여부
  const [hasStarted, setHasStarted] = useState(false)

  // 시작 딜레이 처리
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setHasStarted(true)
    }, startDelay)

    return () => clearTimeout(startTimer)
  }, [startDelay])

  // 타이핑 효과 처리
  useEffect(() => {
    // 시작 전이거나 완료된 경우 return
    if (!hasStarted || isComplete) return

    const currentText = texts[currentIndex]

    if (currentCharIndex < currentText.length) {
      // 현재 텍스트 타이핑 중
      const timer = setTimeout(() => {
        setDisplayTexts((prev) => {
          const newTexts = [...prev]
          newTexts[currentIndex] = currentText.substring(0, currentCharIndex + 1)
          return newTexts
        })
        setCurrentCharIndex((prev) => prev + 1)
      }, typingSpeed)

      return () => clearTimeout(timer)
    } else if (currentIndex < texts.length - 1) {
      // 다음 텍스트로 이동
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setCurrentCharIndex(0)
      }, 300) // 텍스트 간 대기 시간

      return () => clearTimeout(timer)
    } else {
      // 모든 타이핑 완료
      setIsComplete(true)
    }
  }, [hasStarted, currentIndex, currentCharIndex, texts, typingSpeed, isComplete])

  return { displayTexts, currentIndex, isComplete, hasStarted }
}
