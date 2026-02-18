/**
 * iframe용 어드민 레이아웃
 *
 * iframe 내부에서 사용되는 간소화된 레이아웃
 * - 사이드바/탭바 없이 콘텐츠만 렌더링
 * - <a> 태그 클릭 시 _iframe 파라미터 자동 유지
 */
'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { useIframeBridge } from '@/hooks/useIframeBridge'
import { useMenuAccessGuard } from '@/hooks/useMenuAccessGuard'

interface IframeLayoutProps {
  children: React.ReactNode
}

export default function IframeLayout({ children }: IframeLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { postToParent, tabId, panelId } = useIframeBridge()

  // 메뉴 접근 권한 확인
  const { allowed, isLoading: isGuardLoading } = useMenuAccessGuard()

  // iframe 파라미터를 URL에 추가하는 헬퍼
  const appendIframeParams = useCallback((url: string) => {
    const urlObj = new URL(url, window.location.origin)
    urlObj.searchParams.set('_iframe', 'true')
    urlObj.searchParams.set('_panelId', panelId)
    urlObj.searchParams.set('_tabId', tabId)
    return urlObj.pathname + urlObj.search
  }, [panelId, tabId])

  // 링크 클릭 인터셉트 - <a> 태그의 _iframe 파라미터 유지
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // 외부 링크나 특수 링크는 무시
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        return
      }

      // 이미 _iframe 파라미터가 있으면 무시
      if (href.includes('_iframe=true')) {
        return
      }

      // 내부 링크: _iframe 파라미터 추가하여 이동
      e.preventDefault()
      const newUrl = appendIframeParams(href)
      router.push(newUrl)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [appendIframeParams, router])

  // 경로 변경 시 부모에게 알림
  useEffect(() => {
    postToParent({
      type: 'NAVIGATE',
      payload: { path: pathname, tabId },
    })
  }, [pathname, postToParent, tabId])

  // 초기 로드 완료 알림
  useEffect(() => {
    postToParent({
      type: 'READY',
      payload: { tabId },
    })
  }, [postToParent, tabId])

  // 권한 없으면 차단 메시지 표시
  if (!isGuardLoading && !allowed) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">접근 권한이 없습니다</h2>
            <p className="text-sm text-gray-500 mt-1">
              이 페이지에 대한 접근 권한이 없습니다.<br />
              관리자에게 권한을 요청해 주세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  )
}
