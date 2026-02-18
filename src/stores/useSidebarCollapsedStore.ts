/**
 * 사이드바 접힘 상태 공유 스토어
 *
 * AdminSidebar와 AdminTabBar에서 공유하여
 * 탭바 좌측의 토글 버튼으로 사이드바를 열고 닫을 수 있게 합니다.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarCollapsedStore {
  isCollapsed: boolean
  toggleCollapsed: () => void
}

export const useSidebarCollapsedStore = create<SidebarCollapsedStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'sidebar-collapsed',
    }
  )
)
