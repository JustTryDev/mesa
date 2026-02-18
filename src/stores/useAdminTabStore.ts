/**
 * Admin 탭 상태 관리 Store (Zustand) - 멀티 패널 지원
 *
 * VS Code 스타일의 듀얼 패널 탭 시스템을 지원합니다.
 * - 최대 2개의 패널을 동시에 표시
 * - 각 패널에서 독립적인 탭 관리
 * - 패널 간 탭 드래그 이동 지원
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 탭 정보 타입
 */
export interface Tab {
  id: string          // 메뉴 ID (예: 'notices', 'categories')
  label: string       // 표시 이름 (예: '공지사항')
  href: string        // 기본 라우트 경로 (예: '/admin/notices')
  currentPath?: string // 탭 내 현재 경로 (예: '/admin/notices/123') - 탭 전환 시 복원용
  isPinned?: boolean  // 고정 탭 여부 (고정되면 닫기 불가)
}

/**
 * 패널 정보 타입
 */
export interface Panel {
  id: string              // 패널 ID ('panel-1', 'panel-2')
  tabs: Tab[]             // 해당 패널의 탭 목록
  activeTabId: string | null  // 해당 패널의 활성 탭
}

/**
 * 패널 레이아웃 정보
 */
export interface PanelLayout {
  panels: Panel[]         // 현재 열린 패널들 (최대 2개)
  activePanelId: string   // 현재 포커스된 패널
  splitRatio: number      // 좌/우 패널 비율 (0.3 ~ 0.7)
}

/**
 * 탭 스토어 상태 및 액션 타입
 */
interface AdminTabStore {
  // === 상태 ===
  layout: PanelLayout
  maxTabs: number                // 패널당 최대 탭 개수

  // === 패널 액션 ===
  createPanel: (tabToMove?: Tab) => void     // 새 패널 생성 (탭을 새 패널로 이동)
  closePanel: (panelId: string) => void      // 패널 닫기
  setActivePanel: (panelId: string) => void  // 패널 포커스 변경
  setSplitRatio: (ratio: number) => void     // 분할 비율 변경

  // === 탭 액션 (패널 지정) ===
  openTab: (tab: Omit<Tab, 'isPinned'>, panelId?: string) => void
  closeTab: (tabId: string, panelId?: string) => void
  setActiveTab: (tabId: string, panelId?: string) => void
  moveTabToPanel: (tabId: string, fromPanelId: string, toPanelId: string, index?: number) => void
  reorderTabs: (fromIndex: number, toIndex: number, panelId?: string) => void

  // === 확장 액션 ===
  closeOtherTabs: (tabId: string, panelId?: string) => void
  closeAllTabs: (panelId?: string) => void
  pinTab: (tabId: string, panelId?: string) => void
  unpinTab: (tabId: string, panelId?: string) => void
  updateTabPath: (tabId: string, path: string) => void

  // === 헬퍼 ===
  getActiveTab: () => Tab | null
  findTabPanel: (tabId: string) => Panel | null
  getPanel: (panelId: string) => Panel | null
  hasTwoPanels: () => boolean
}

/**
 * 초기 패널 레이아웃
 */
const initialLayout: PanelLayout = {
  panels: [
    { id: 'panel-1', tabs: [], activeTabId: null }
  ],
  activePanelId: 'panel-1',
  splitRatio: 0.5,
}

/**
 * Admin 탭 스토어 (멀티 패널 지원)
 */
export const useAdminTabStore = create<AdminTabStore>()(
  persist(
    (set, get) => ({
      // === 초기 상태 ===
      layout: initialLayout,
      maxTabs: 15,

      // === 패널 생성 ===
      createPanel: (tabToMove) => {
        const { layout } = get()

        // 이미 2개 패널이면 추가 안 함
        if (layout.panels.length >= 2) return

        // 예측 가능한 패널 ID 사용 (panel-2)
        const newPanelId = 'panel-2'

        const newPanel: Panel = {
          id: newPanelId,
          tabs: tabToMove ? [{ ...tabToMove, isPinned: false }] : [],
          activeTabId: tabToMove?.id || null,
        }

        // 탭을 이동하는 경우, 원래 패널에서 제거
        let updatedPanels = [...layout.panels]
        if (tabToMove) {
          updatedPanels = updatedPanels.map(panel => ({
            ...panel,
            tabs: panel.tabs.filter(t => t.id !== tabToMove.id),
            activeTabId: panel.activeTabId === tabToMove.id
              ? (panel.tabs.filter(t => t.id !== tabToMove.id)[0]?.id || null)
              : panel.activeTabId,
          }))
        }

        set({
          layout: {
            ...layout,
            panels: [...updatedPanels, newPanel],
            activePanelId: newPanel.id,
          },
        })
      },

      // === 패널 닫기 ===
      closePanel: (panelId) => {
        const { layout } = get()

        // 패널이 1개면 닫을 수 없음
        if (layout.panels.length <= 1) return

        const remainingPanels = layout.panels.filter(p => p.id !== panelId)

        set({
          layout: {
            ...layout,
            panels: remainingPanels,
            activePanelId: remainingPanels[0]?.id || 'panel-1',
          },
        })
      },

      // === 활성 패널 변경 ===
      setActivePanel: (panelId) => {
        const { layout } = get()
        if (layout.panels.some(p => p.id === panelId)) {
          set({
            layout: { ...layout, activePanelId: panelId },
          })
        }
      },

      // === 분할 비율 변경 ===
      setSplitRatio: (ratio) => {
        const { layout } = get()
        // 비율은 0.2 ~ 0.8 사이로 제한
        const clampedRatio = Math.max(0.2, Math.min(0.8, ratio))
        set({
          layout: { ...layout, splitRatio: clampedRatio },
        })
      },

      // === 탭 열기 ===
      openTab: (tab, panelId) => {
        const { layout, maxTabs } = get()
        const targetPanelId = panelId || layout.activePanelId

        // 전체 패널에서 이미 열려있는 탭인지 확인
        for (const panel of layout.panels) {
          const existingTab = panel.tabs.find(t => t.id === tab.id)
          if (existingTab) {
            // 해당 패널로 전환하고 탭 활성화
            set({
              layout: {
                ...layout,
                activePanelId: panel.id,
                panels: layout.panels.map(p =>
                  p.id === panel.id
                    ? { ...p, activeTabId: tab.id }
                    : p
                ),
              },
            })
            return
          }
        }

        // 대상 패널에 새 탭 추가
        const updatedPanels = layout.panels.map(panel => {
          if (panel.id !== targetPanelId) return panel

          // 최대 탭 개수 체크
          if (panel.tabs.length >= maxTabs) {
            const oldestUnpinnedTab = panel.tabs.find(t => !t.isPinned)
            if (oldestUnpinnedTab) {
              const filteredTabs = panel.tabs.filter(t => t.id !== oldestUnpinnedTab.id)
              return {
                ...panel,
                tabs: [...filteredTabs, { ...tab, isPinned: false }],
                activeTabId: tab.id,
              }
            }
            return panel
          }

          return {
            ...panel,
            tabs: [...panel.tabs, { ...tab, isPinned: false }],
            activeTabId: tab.id,
          }
        })

        set({
          layout: {
            ...layout,
            panels: updatedPanels,
            activePanelId: targetPanelId,
          },
        })
      },

      // === 탭 닫기 ===
      closeTab: (tabId, panelId) => {
        const { layout, closePanel } = get()
        const targetPanel = panelId
          ? layout.panels.find(p => p.id === panelId)
          : layout.panels.find(p => p.tabs.some(t => t.id === tabId))

        if (!targetPanel) return

        const tabToClose = targetPanel.tabs.find(t => t.id === tabId)
        if (tabToClose?.isPinned) return

        const newTabs = targetPanel.tabs.filter(t => t.id !== tabId)

        // 마지막 탭을 닫으면 패널도 닫기 (패널이 2개일 때만)
        if (newTabs.length === 0 && layout.panels.length > 1) {
          closePanel(targetPanel.id)
          return
        }

        // 활성 탭 재선택
        let newActiveId = targetPanel.activeTabId
        if (targetPanel.activeTabId === tabId) {
          const closedIndex = targetPanel.tabs.findIndex(t => t.id === tabId)
          newActiveId = newTabs[closedIndex - 1]?.id
            || newTabs[closedIndex]?.id
            || newTabs[0]?.id
            || null
        }

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(p =>
              p.id === targetPanel.id
                ? { ...p, tabs: newTabs, activeTabId: newActiveId }
                : p
            ),
          },
        })
      },

      // === 탭 전환 ===
      setActiveTab: (tabId, panelId) => {
        const { layout } = get()
        const targetPanel = panelId
          ? layout.panels.find(p => p.id === panelId)
          : layout.panels.find(p => p.tabs.some(t => t.id === tabId))

        if (!targetPanel) return

        if (targetPanel.tabs.some(t => t.id === tabId)) {
          set({
            layout: {
              ...layout,
              activePanelId: targetPanel.id,
              panels: layout.panels.map(p =>
                p.id === targetPanel.id
                  ? { ...p, activeTabId: tabId }
                  : p
              ),
            },
          })
        }
      },

      // === 패널 간 탭 이동 ===
      moveTabToPanel: (tabId, fromPanelId, toPanelId, index) => {
        const { layout, closePanel } = get()

        const fromPanel = layout.panels.find(p => p.id === fromPanelId)
        const toPanel = layout.panels.find(p => p.id === toPanelId)

        if (!fromPanel || !toPanel) return

        const tabToMove = fromPanel.tabs.find(t => t.id === tabId)
        if (!tabToMove) return

        // 원본 패널에서 탭 제거
        const newFromTabs = fromPanel.tabs.filter(t => t.id !== tabId)

        // 대상 패널에 탭 추가
        const newToTabs = [...toPanel.tabs]
        if (typeof index === 'number') {
          newToTabs.splice(index, 0, tabToMove)
        } else {
          newToTabs.push(tabToMove)
        }

        // 원본 패널의 활성 탭 재선택
        let newFromActiveId = fromPanel.activeTabId
        if (fromPanel.activeTabId === tabId) {
          const movedIndex = fromPanel.tabs.findIndex(t => t.id === tabId)
          newFromActiveId = newFromTabs[movedIndex - 1]?.id
            || newFromTabs[movedIndex]?.id
            || newFromTabs[0]?.id
            || null
        }

        // 원본 패널이 비어있으면 닫기
        if (newFromTabs.length === 0 && layout.panels.length > 1) {
          set({
            layout: {
              ...layout,
              panels: layout.panels
                .filter(p => p.id !== fromPanelId)
                .map(p =>
                  p.id === toPanelId
                    ? { ...p, tabs: newToTabs, activeTabId: tabId }
                    : p
                ),
              activePanelId: toPanelId,
            },
          })
          return
        }

        set({
          layout: {
            ...layout,
            activePanelId: toPanelId,
            panels: layout.panels.map(p => {
              if (p.id === fromPanelId) {
                return { ...p, tabs: newFromTabs, activeTabId: newFromActiveId }
              }
              if (p.id === toPanelId) {
                return { ...p, tabs: newToTabs, activeTabId: tabId }
              }
              return p
            }),
          },
        })
      },

      // === 탭 순서 변경 ===
      reorderTabs: (fromIndex, toIndex, panelId) => {
        const { layout } = get()
        const targetPanelId = panelId || layout.activePanelId

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => {
              if (panel.id !== targetPanelId) return panel

              const newTabs = [...panel.tabs]
              const [removed] = newTabs.splice(fromIndex, 1)
              newTabs.splice(toIndex, 0, removed)
              return { ...panel, tabs: newTabs }
            }),
          },
        })
      },

      // === 다른 탭 모두 닫기 ===
      closeOtherTabs: (tabId, panelId) => {
        const { layout } = get()
        const targetPanelId = panelId || layout.activePanelId

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => {
              if (panel.id !== targetPanelId) return panel

              const newTabs = panel.tabs.filter(t => t.id === tabId || t.isPinned)
              return {
                ...panel,
                tabs: newTabs,
                activeTabId: tabId,
              }
            }),
          },
        })
      },

      // === 전체 닫기 (고정 탭 제외) ===
      closeAllTabs: (panelId) => {
        const { layout } = get()
        const targetPanelId = panelId || layout.activePanelId

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => {
              if (panel.id !== targetPanelId) return panel

              const pinnedTabs = panel.tabs.filter(t => t.isPinned)
              return {
                ...panel,
                tabs: pinnedTabs,
                activeTabId: pinnedTabs[0]?.id || null,
              }
            }),
          },
        })
      },

      // === 탭 고정 ===
      pinTab: (tabId, panelId) => {
        const { layout } = get()
        const targetPanel = panelId
          ? layout.panels.find(p => p.id === panelId)
          : layout.panels.find(p => p.tabs.some(t => t.id === tabId))

        if (!targetPanel) return

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => {
              if (panel.id !== targetPanel.id) return panel

              const newTabs = panel.tabs.map(t =>
                t.id === tabId ? { ...t, isPinned: true } : t
              )
              const pinnedTabs = newTabs.filter(t => t.isPinned)
              const unpinnedTabs = newTabs.filter(t => !t.isPinned)
              return { ...panel, tabs: [...pinnedTabs, ...unpinnedTabs] }
            }),
          },
        })
      },

      // === 탭 고정 해제 ===
      unpinTab: (tabId, panelId) => {
        const { layout } = get()
        const targetPanel = panelId
          ? layout.panels.find(p => p.id === panelId)
          : layout.panels.find(p => p.tabs.some(t => t.id === tabId))

        if (!targetPanel) return

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => {
              if (panel.id !== targetPanel.id) return panel

              return {
                ...panel,
                tabs: panel.tabs.map(t =>
                  t.id === tabId ? { ...t, isPinned: false } : t
                ),
              }
            }),
          },
        })
      },

      // === 탭 경로 업데이트 ===
      updateTabPath: (tabId, path) => {
        const { layout } = get()

        set({
          layout: {
            ...layout,
            panels: layout.panels.map(panel => ({
              ...panel,
              tabs: panel.tabs.map(t =>
                t.id === tabId ? { ...t, currentPath: path } : t
              ),
            })),
          },
        })
      },

      // === 활성 탭 가져오기 ===
      getActiveTab: () => {
        const { layout } = get()
        const activePanel = layout.panels.find(p => p.id === layout.activePanelId)
        if (!activePanel) return null
        return activePanel.tabs.find(t => t.id === activePanel.activeTabId) || null
      },

      // === 탭이 있는 패널 찾기 ===
      findTabPanel: (tabId) => {
        const { layout } = get()
        return layout.panels.find(p => p.tabs.some(t => t.id === tabId)) || null
      },

      // === 패널 가져오기 ===
      getPanel: (panelId) => {
        const { layout } = get()
        return layout.panels.find(p => p.id === panelId) || null
      },

      // === 2패널 여부 ===
      hasTwoPanels: () => {
        const { layout } = get()
        return layout.panels.length === 2
      },
    }),
    {
      name: 'admin-tabs',
      skipHydration: true,
      // sessionStorage 사용 (브라우저 탭 닫으면 초기화)
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          sessionStorage.removeItem(name)
        },
      },
      // 마이그레이션: 기존 단일 탭 데이터를 패널 구조로 변환
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>

        // 기존 형식인 경우 (tabs 배열이 있고 layout이 없는 경우)
        if (state?.tabs && !state?.layout) {
          const oldTabs = state.tabs as Tab[]
          const oldActiveTabId = state.activeTabId as string | null

          return {
            layout: {
              panels: [
                {
                  id: 'panel-1',
                  tabs: oldTabs,
                  activeTabId: oldActiveTabId,
                }
              ],
              activePanelId: 'panel-1',
              splitRatio: 0.5,
            },
            maxTabs: 15,
          }
        }

        return persistedState
      },
      version: 2, // 버전 업그레이드
    }
  )
)

/**
 * Selector: 활성 패널의 탭 목록
 *
 * getter 대신 selector 패턴 사용 (Zustand set() 시 getter가 깨지는 문제 방지)
 */
export const selectActivePanelTabs = (state: AdminTabStore): Tab[] => {
  const activePanel = state.layout.panels.find(p => p.id === state.layout.activePanelId)
  return activePanel?.tabs || []
}

/**
 * Selector: 활성 패널의 활성 탭 ID
 */
export const selectActiveTabId = (state: AdminTabStore): string | null => {
  const activePanel = state.layout.panels.find(p => p.id === state.layout.activePanelId)
  return activePanel?.activeTabId || null
}
