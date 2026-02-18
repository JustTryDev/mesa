import { useState, useCallback } from 'react'

/**
 * useDisclosure - 열기/닫기 상태 관리 훅
 *
 * 비유: "문 개폐 담당"과 같습니다.
 * 모달을 열고 닫거나, 아코디언을 펼치고 접는 동작을
 * useState + setter 대신 이 훅 하나로 깔끔하게 관리합니다.
 *
 * 사용 예시:
 * const rejectModal = useDisclosure()
 * // rejectModal.isOpen → false
 * // rejectModal.open() → true
 * // rejectModal.close() → false
 * // rejectModal.toggle() → 현재 상태 반전
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return { isOpen, open, close, toggle }
}
