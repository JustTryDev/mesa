'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 마우스 위치 정보 타입
 */
interface MousePosition {
  x: number
  y: number
}

/**
 * 마우스 위치 추적 훅
 *
 * 📌 이 훅이 하는 일:
 * - 마우스가 움직일 때마다 현재 위치(x, y)를 추적합니다
 * - throttle을 적용해서 성능을 최적화합니다 (너무 자주 업데이트 안 함)
 *
 * 📌 일상생활 예시:
 * GPS가 자동차 위치를 계속 추적하는 것과 같습니다.
 * 하지만 0.001초마다 위치를 확인하면 배터리가 빨리 닳듯이,
 * 우리도 적당한 간격(16ms, 약 60fps)으로 위치를 확인합니다.
 *
 * @param throttleMs - 업데이트 간격 (기본값: 16ms = 약 60fps)
 * @returns 현재 마우스 위치 { x, y }
 *
 * @example
 * const { x, y } = useMousePosition()
 * // x: 마우스의 가로 위치 (왼쪽에서부터의 픽셀)
 * // y: 마우스의 세로 위치 (위에서부터의 픽셀)
 */
export function useMousePosition(throttleMs: number = 16): MousePosition {
  // 마우스 위치를 저장하는 state
  // 초기값은 화면 중앙 또는 (0, 0)
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 })

  // throttle을 위한 타임스탬프 저장
  // useRef를 쓰는 이유: 값이 바뀌어도 리렌더링을 유발하지 않음
  const lastUpdateTime = useRef<number>(0)

  // 마우스 이동 이벤트 핸들러
  // useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const now = Date.now()

    // throttle: 마지막 업데이트로부터 충분한 시간이 지났는지 확인
    // 📌 비유: "아까 확인했으니까 잠깐 기다렸다가 다시 확인하자"
    if (now - lastUpdateTime.current >= throttleMs) {
      lastUpdateTime.current = now
      setPosition({
        x: event.clientX, // 브라우저 창 기준 가로 위치
        y: event.clientY, // 브라우저 창 기준 세로 위치
      })
    }
  }, [throttleMs])

  useEffect(() => {
    // SSR 환경에서는 window가 없으므로 체크
    if (typeof window === 'undefined') return

    // 마우스 이동 이벤트 리스너 등록
    window.addEventListener('mousemove', handleMouseMove)

    // 클린업: 컴포넌트가 사라질 때 이벤트 리스너 제거
    // 📌 비유: 이사 갈 때 전기/가스 해지하는 것처럼, 안 쓰는 리스너는 정리
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  return position
}
