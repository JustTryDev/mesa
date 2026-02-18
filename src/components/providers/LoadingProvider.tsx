'use client'

/**
 * LoadingProvider
 *
 * 페이지 전환 시 로딩 오버레이를 표시하는 프로바이더
 *
 * ⚠️ 테스트용: TEST_DELAY를 0으로 설정하면 실제 로딩 시간만 적용됩니다.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

// ⚠️ 테스트용 딜레이 (ms) - 프로덕션에서는 0으로 설정
const TEST_DELAY = 0

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // 초기 로드 시 로딩 표시
  useEffect(() => {
    if (isInitialLoad && TEST_DELAY > 0) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setIsInitialLoad(false)
      }, TEST_DELAY)
      return () => clearTimeout(timer)
    }
    setIsInitialLoad(false)
  }, [isInitialLoad])

  // 페이지 전환 감지
  useEffect(() => {
    if (isInitialLoad) return

    if (TEST_DELAY > 0) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, TEST_DELAY)
      return () => clearTimeout(timer)
    }
  }, [pathname, isInitialLoad])

  return (
    <>
      {children}
      <LoadingOverlay
        isOpen={isLoading}
        delay={100} // 테스트용이므로 딜레이 짧게
      />
    </>
  )
}

export default LoadingProvider
