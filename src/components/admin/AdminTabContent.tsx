/**
 * Admin 탭 콘텐츠 컴포넌트 (하이브리드 방식)
 *
 * 핵심 변경:
 * - 동적 import 제거 → Next.js children 활용
 * - URL 변경 시 자동으로 올바른 페이지 렌더링
 * - 탭은 "메뉴 카테고리" 역할만 담당
 *
 * 비유: 탭은 "폴더"이고, children은 "폴더 안의 파일"입니다.
 * 공지사항 폴더(탭) 안에서 목록, 수정, 새작성 파일(페이지)을 자유롭게 열 수 있어요.
 */
'use client'

import { usePathname } from 'next/navigation'
import { useAdminTabStore, selectActivePanelTabs, selectActiveTabId } from '@/stores/useAdminTabStore'
import { useAdminHydration } from './AdminHydrationProvider'
import { extractMenuIdFromPath } from '@/hooks/useAdminNavigation'

interface AdminTabContentProps {
  /**
   * Next.js가 렌더링한 페이지 컴포넌트
   * 탭 내에서 URL이 변경되면 이 children도 변경됨
   */
  children: React.ReactNode
}

/**
 * 환영 메시지 컴포넌트
 */
function WelcomeMessage() {
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

export default function AdminTabContent({ children }: AdminTabContentProps) {
  // selector 패턴으로 파생 상태 조회 (getter 버그 방지)
  const tabs = useAdminTabStore(selectActivePanelTabs)
  const activeTabId = useAdminTabStore(selectActiveTabId)
  const pathname = usePathname()

  // hydration 상태를 Context에서 가져옴 (rehydrate()는 AdminHydrationProvider에서 1회만 호출)
  const isHydrated = useAdminHydration()

  // hydration 전에는 children 그대로 표시 (깜빡임 방지)
  if (!isHydrated) {
    return <div className="h-full">{children}</div>
  }

  // 열린 탭이 없으면 환영 메시지
  if (tabs.length === 0) {
    return <WelcomeMessage />
  }

  // 현재 URL의 메뉴 ID 추출
  const currentMenuId = extractMenuIdFromPath(pathname)

  // 현재 URL이 활성 탭에 해당하는지 확인
  const isActiveTabContent = currentMenuId === activeTabId

  return (
    <div className="h-full">
      {isActiveTabContent ? (
        // 활성 탭의 콘텐츠 (Next.js가 렌더링한 페이지)
        // children은 URL에 따라 자동으로 변경됨!
        children
      ) : (
        // URL과 활성 탭이 다른 경우 (탭 클릭으로 전환 필요)
        <div className="flex flex-col items-center justify-center h-full text-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            상단 탭을 클릭해서 전환하세요
          </p>
        </div>
      )}
    </div>
  )
}
