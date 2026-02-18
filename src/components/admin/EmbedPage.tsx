'use client'

/**
 * 외부 사이트 iframe 임베드 공용 컴포넌트
 *
 * 11개 어드민 페이지에서 동일한 구조로 사용됩니다.
 * props로 URL, 제목, 설명만 전달하면 로딩/에러/새 탭 열기가 자동 처리됩니다.
 */

import { useState } from 'react'
import { ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmbedPageProps {
  /** iframe으로 보여줄 사이트 URL */
  url: string
  /** 상단 헤더에 표시할 제목 */
  title: string
  /** 제목 옆에 표시할 설명 */
  description: string
  /** iframe sandbox 속성 (기본값: allow-same-origin allow-scripts allow-popups allow-forms) */
  sandbox?: string
}

export default function EmbedPage({
  url,
  title,
  description,
  sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms',
}: EmbedPageProps) {
  const [loadFailed, setLoadFailed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeError = () => {
    setLoadFailed(true)
    setIsLoading(false)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRetry = () => {
    setLoadFailed(false)
    setIsLoading(true)
  }

  return (
    <div className="h-full flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <span className="text-sm text-gray-500">{description}</span>
        </div>
        <Button onClick={openInNewTab} variant="outline" size="sm" className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          새 탭에서 열기
        </Button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 relative bg-gray-100">
        {isLoading && !loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">로딩 중...</p>
            </div>
          </div>
        )}

        {loadFailed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">임베드가 차단되었습니다</h2>
              <p className="text-gray-600 mb-6">
                해당 사이트는 보안 정책으로 인해 임베드할 수 없습니다. 새 탭에서 직접 방문해 주세요.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </Button>
                <Button onClick={openInNewTab} className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  새 탭에서 열기
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={url}
            className="w-full h-full border-0"
            title={title}
            onError={handleIframeError}
            onLoad={handleIframeLoad}
            sandbox={sandbox}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  )
}
