/**
 * Admin 개별 패널 컴포넌트
 *
 * 각 패널은 독립적인 탭바와 콘텐츠 영역을 가집니다.
 * - 패널별 탭 관리
 * - iframe 렌더링은 IframePool에서 중앙 관리 (패널 간 이동 시 상태 보존)
 * - 콘텐츠 영역 ref를 IframePool에 제공하여 iframe 배치
 */
'use client'

import { useCallback } from 'react'
import { useAdminHydration } from './AdminHydrationProvider'
import { X } from 'lucide-react'
import { useAdminTabStore } from '@/stores/useAdminTabStore'
import AdminTabBar from './AdminTabBar'

interface AdminPanelProps {
  panelId: string
  isActive: boolean
  isDragOver?: boolean
  /** IframePool이 iframe을 배치할 콘텐츠 영역 ref 콜백 */
  contentRef?: (el: HTMLElement | null) => void
  children: React.ReactNode
}

/**
 * 패널 내 환영 메시지 (탭이 없을 때)
 */
function PanelWelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        탭을 열어보세요
      </h3>
      <p className="text-gray-500 max-w-sm">
        왼쪽 사이드바에서 메뉴를 클릭하면
        <br />
        여기에 탭으로 열립니다.
      </p>
    </div>
  )
}

export default function AdminPanel({ panelId, isActive, isDragOver, contentRef, children }: AdminPanelProps) {
  const { setActivePanel, closePanel, hasTwoPanels, getPanel } = useAdminTabStore()
  // hydration 상태를 Context에서 가져옴 (rehydrate()는 AdminHydrationProvider에서 1회만 호출)
  const isHydrated = useAdminHydration()

  const panel = getPanel(panelId)

  // 패널 클릭 시 활성화 (URL 이동은 하지 않음 - iframe이 자체 URL 유지)
  const handlePanelClick = useCallback(() => {
    if (!isActive) {
      setActivePanel(panelId)
    }
  }, [isActive, panelId, setActivePanel])

  // hydration 전
  if (!isHydrated) {
    return <div className="flex-1 flex flex-col min-h-0">{children}</div>
  }

  if (!panel) {
    return null
  }

  const showCloseButton = hasTwoPanels()

  return (
    <div
      className={`
        flex-1 flex flex-col min-h-0 transition-all
        ${isActive ? '' : 'cursor-pointer'}
        ${isDragOver ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/30' : ''}
      `}
      onClick={handlePanelClick}
    >
      {/* 패널 헤더 (탭바 + 패널 닫기) */}
      <div className="flex items-center bg-white border-b border-gray-200 relative">
        {/* 탭바 */}
        <div className="flex-1 min-w-0">
          <AdminTabBar panelId={panelId} />
        </div>

        {/* 패널 닫기 버튼 (2패널일 때만) */}
        {showCloseButton && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              closePanel(panelId)
            }}
            className="p-1.5 mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="패널 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 활성 패널 표시 */}
        {isActive && hasTwoPanels() && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
        )}
      </div>

      {/* 콘텐츠 영역 - IframePool이 여기에 iframe을 appendChild */}
      <main
        ref={contentRef}
        className="flex-1 min-h-0 overflow-hidden bg-gray-50 relative"
      >
        {panel.tabs.length === 0 && <PanelWelcomeMessage />}
        {/* iframe은 IframePool에서 useLayoutEffect로 이 영역에 배치됨 */}
      </main>
    </div>
  )
}
