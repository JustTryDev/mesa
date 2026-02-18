/**
 * 어드민 레이아웃 래퍼
 *
 * iframe 모드 감지 후 적절한 레이아웃 렌더링
 * - 일반 모드: AdminLayout (사이드바 + 탭바 + 콘텐츠)
 * - iframe 모드: IframeLayout (콘텐츠만)
 */
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import IframeLayout from './IframeLayout'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
}

/**
 * 레이아웃 선택 컴포넌트
 *
 * iframe 감지 방법 2가지 병행:
 * 1. URL 파라미터 `_iframe=true` (최초 로드 시)
 * 2. `window.self !== window.top` (네비게이션 후 파라미터 유실 대비)
 *
 * useEffect로 감지하여 SSR/클라이언트 hydration 불일치 방지
 */
function LayoutSelector({ children }: AdminLayoutWrapperProps) {
  const searchParams = useSearchParams()
  const isIframeParam = searchParams.get('_iframe') === 'true'

  // useEffect로 iframe 감지 (hydration 안전)
  const [isEmbedded, setIsEmbedded] = useState(false)
  useEffect(() => {
    try {
      if (window.self !== window.top) setIsEmbedded(true)
    } catch {
      setIsEmbedded(true)
    }
  }, [])

  if (isIframeParam || isEmbedded) {
    return <IframeLayout>{children}</IframeLayout>
  }

  return <AdminLayout>{children}</AdminLayout>
}

/**
 * Suspense 래퍼
 *
 * useSearchParams가 클라이언트에서만 동작하므로
 * Suspense boundary 필요
 */
export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      }
    >
      <LayoutSelector>{children}</LayoutSelector>
    </Suspense>
  )
}
