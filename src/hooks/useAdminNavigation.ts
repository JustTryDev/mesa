/**
 * Admin 탭 ↔ URL 동기화 훅 (멀티 패널 지원)
 *
 * URL 변경을 감지해서 해당 메뉴 탭을 자동으로 활성화합니다.
 *
 * 비유: GPS가 현재 위치를 감지해서 지도에 표시하는 것처럼,
 * 현재 URL을 감지해서 해당 탭을 자동으로 활성화합니다.
 *
 * 예시:
 * - /admin/notices → 'notices' 탭 활성화
 * - /admin/notices/new → 'notices' 탭 활성화 (같은 탭)
 * - /admin/notices/123 → 'notices' 탭 활성화 (같은 탭)
 * - /admin/categories → 'categories' 탭 활성화
 */
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAdminTabStore } from '@/stores/useAdminTabStore'
import { getMenuById, ADMIN_MENUS } from '@/lib/constants/adminMenus'

/**
 * URL에서 메뉴 ID 추출
 *
 * /admin/notices → 'notices'
 * /admin/notices/new → 'notices'
 * /admin/notices/123 → 'notices'
 * /admin/alibaba-orders → 'alibaba-orders'
 * /admin/alibaba-orders/abc123 → 'alibaba-orders'
 */
export function extractMenuIdFromPath(pathname: string): string | null {
  // /admin 자체는 메뉴 ID 없음
  if (pathname === '/admin') return null

  // /admin/xxx 에서 xxx 추출
  const match = pathname.match(/^\/admin\/([^/]+)/)
  if (!match) return null

  const segment = match[1]

  // ADMIN_MENUS에 등록된 ID인지 확인
  const menu = ADMIN_MENUS.find(m => m.id === segment)
  return menu ? segment : null
}

/**
 * Admin Navigation 훅 (멀티 패널 지원)
 *
 * - URL 변경 감지 → 해당 탭 자동 활성화
 * - 탭이 어느 패널에 있든 찾아서 활성화
 * - 탭이 없으면 활성 패널에 새로 열기
 * - 탭 내 현재 경로 저장
 *
 * 주의: 무한 루프 방지를 위해 getState() 사용
 */
export function useAdminNavigation() {
  const pathname = usePathname()
  // 마지막으로 처리한 pathname을 저장 (중복 실행 방지)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    // hydration 이후에만 실행
    if (typeof window === 'undefined') return

    // 같은 pathname이면 무시 (중복 실행 방지)
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    // URL에서 메뉴 ID 추출
    const menuId = extractMenuIdFromPath(pathname)

    // admin 메인 페이지거나 등록되지 않은 경로면 무시
    if (!menuId) return

    // getState()로 현재 상태 조회 (의존성 배열에서 제외하기 위함)
    const {
      layout,
      openTab,
      setActiveTab,
      setActivePanel,
      updateTabPath,
      findTabPanel,
    } = useAdminTabStore.getState()

    // 전체 패널에서 탭 찾기
    const tabPanel = findTabPanel(menuId)

    if (tabPanel) {
      // 탭이 이미 열려있으면 탭 경로만 업데이트
      // 패널 활성화는 handlePanelClick에서 이미 처리되므로 여기서는 스킵
      // (상태 업데이트 타이밍 경합 방지)
      const existingTab = tabPanel.tabs.find(t => t.id === menuId)

      // 현재 경로 저장 (경로가 다를 때만)
      if (existingTab && existingTab.currentPath !== pathname) {
        updateTabPath(menuId, pathname)
      }
    } else {
      // 새 탭 열기 (활성 패널에)
      const menu = getMenuById(menuId)
      if (menu) {
        openTab({
          id: menu.id,
          label: menu.label,
          href: menu.href,
        })
        // 현재 경로도 저장
        updateTabPath(menuId, pathname)
      }
    }
  }, [pathname])  // pathname만 의존성으로 설정 (무한 루프 방지)
}
