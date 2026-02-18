import { useRef, useEffect } from 'react'

/**
 * 컴포넌트가 화면에 표시되고 있는지 확인하는 훅
 *
 * 비유: 전화 통화 중에 상대방이 이미 끊었는지 확인하는 것과 같습니다.
 * 비동기 작업(API 호출 등)이 끝났을 때, 이미 화면을 떠난 컴포넌트에
 * 상태를 업데이트하면 에러가 나므로 이 훅으로 확인합니다.
 *
 * 9개 파일에서 반복되던 패턴을 이 훅 하나로 통합합니다.
 */
export function useIsMounted() {
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return isMountedRef
}
