/**
 * Admin 탭 바 컴포넌트 (멀티 패널 지원)
 *
 * 브라우저 탭처럼 열린 페이지들을 상단에 표시합니다.
 * - 탭 클릭: 해당 페이지로 전환
 * - 탭 드래그: 순서 변경 또는 다른 패널로 이동
 * - X 버튼: 탭 닫기
 * - 우클릭: 컨텍스트 메뉴 (고정, 다른 탭 닫기 등)
 * - 마우스 휠: 가로 스크롤
 * - 분할 버튼: 새 패널에서 열기 (1024px 이상에서만)
 */
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAdminHydration } from './AdminHydrationProvider'
import { useRouter } from 'next/navigation'
import { X, Pin, ChevronLeft, ChevronRight, GripVertical, Columns2, PanelLeft } from 'lucide-react'
import { useAdminTabStore, Tab, Panel } from '@/stores/useAdminTabStore'
import { getMenuById } from '@/lib/constants/adminMenus'
import { useResponsivePanel } from '@/hooks/useResponsivePanel'
import { useSidebarCollapsedStore } from '@/stores/useSidebarCollapsedStore'

// 드래그 앤 드롭 관련 import
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

/**
 * 컨텍스트 메뉴 (우클릭 메뉴)
 */
interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  tabId: string | null
}

interface AdminTabBarProps {
  panelId?: string  // 패널 ID (멀티 패널 모드용)
}

export default function AdminTabBar({ panelId }: AdminTabBarProps) {
  const {
    layout,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    pinTab,
    unpinTab,
    createPanel,
    hasTwoPanels,
    getPanel,
  } = useAdminTabStore()

  const router = useRouter()
  const { isDualPanelAllowed } = useResponsivePanel()

  // 현재 패널 또는 활성 패널의 탭 가져오기
  const currentPanelId = panelId || layout.activePanelId
  const panel = getPanel(currentPanelId)
  const tabs = panel?.tabs || []
  const activeTabId = panel?.activeTabId || null

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 스크롤 버튼 표시 여부
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    tabId: null,
  })

  // hydration 상태를 Context에서 가져옴 (rehydrate()는 AdminHydrationProvider에서 1회만 호출)
  const isHydrated = useAdminHydration()

  // 사이드바 접기/펼치기 상태 (Rules of Hooks: 조건부 return 전에 호출해야 함)
  const { isCollapsed, toggleCollapsed } = useSidebarCollapsedStore()

  // 드롭 가능 영역 설정 (패널 탭바 전체)
  const { setNodeRef: setDropzoneRef, isOver } = useDroppable({
    id: `panel-dropzone-${currentPanelId}`,
  })

  // 스크롤 상태 업데이트
  const updateScrollArrows = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollArrows()
    container.addEventListener('scroll', updateScrollArrows)
    window.addEventListener('resize', updateScrollArrows)

    return () => {
      container.removeEventListener('scroll', updateScrollArrows)
      window.removeEventListener('resize', updateScrollArrows)
    }
  }, [updateScrollArrows, tabs])

  // 마우스 휠로 가로 스크롤
  const handleWheel = (e: React.WheelEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollLeft += e.deltaY
    e.preventDefault()
  }

  // 스크롤 버튼 클릭
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 150
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  // 컨텍스트 메뉴 열기
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    })
  }

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  // 컨텍스트 메뉴 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()
    if (contextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.isOpen])

  // 분할 버튼 클릭 (활성 탭을 새 패널로 이동)
  const handleSplitClick = () => {
    if (hasTwoPanels()) return

    const currentTab = tabs.find(t => t.id === activeTabId)
    if (currentTab && tabs.length > 1) {
      createPanel(currentTab)
    }
  }

  // hydration 전에는 렌더링하지 않음
  if (!isHydrated) return null

  // 사이드바 토글 버튼 (노션 스타일)
  const sidebarToggle = (
    <button
      onClick={toggleCollapsed}
      className={`hidden lg:flex p-1.5 mx-1 rounded hover:bg-gray-100 flex-shrink-0 ${
        isCollapsed ? 'text-gray-600' : 'text-gray-400 hover:text-gray-600'
      }`}
      title={isCollapsed ? '사이드바 열기' : '사이드바 닫기'}
    >
      <PanelLeft className="w-5 h-5" />
    </button>
  )

  // 탭이 없으면 빈 영역 표시 (드롭 가능)
  if (tabs.length === 0) {
    return (
      <div
        ref={setDropzoneRef}
        className={`h-10 bg-white flex items-center px-4 flex-shrink-0 ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''
        }`}
      >
        {sidebarToggle}
        <span className="text-sm text-gray-400">
          {isOver ? '여기에 탭을 놓으세요' : '사이드바에서 메뉴를 클릭해서 탭을 열어보세요'}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={setDropzoneRef}
      className={`h-10 bg-white flex items-center relative flex-shrink-0 ${
        isOver ? 'ring-2 ring-blue-400 ring-inset' : ''
      }`}
    >
      {/* 사이드바 토글 (노션 스타일) */}
      {sidebarToggle}

      {/* 왼쪽 스크롤 버튼 */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-white via-white to-transparent hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {/* 탭 목록 (스크롤 + 드래그 가능) */}
      <SortableContext
        items={tabs.map(tab => tab.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex-1 flex items-end overflow-x-auto scrollbar-hide px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => (
            <SortableTabItem
              key={tab.id}
              tab={tab}
              isActive={activeTabId === tab.id}
              onClick={() => {
                setActiveTab(tab.id, currentPanelId)
                router.push(tab.currentPath || tab.href)
              }}
              onClose={() => closeTab(tab.id, currentPanelId)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* 분할 버튼 (2패널이 아닐 때만, 탭이 2개 이상일 때만, 데스크톱에서만) */}
      {!hasTwoPanels() && tabs.length >= 2 && isDualPanelAllowed && (
        <button
          onClick={handleSplitClick}
          className="p-1.5 mx-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="화면 분할 (현재 탭을 새 패널에서 열기)"
        >
          <Columns2 className="w-4 h-4" />
        </button>
      )}

      {/* 오른쪽 스크롤 버튼 */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-white via-white to-transparent hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu.isOpen && contextMenu.tabId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tab={tabs.find(t => t.id === contextMenu.tabId)!}
          panelId={currentPanelId}
          isDualPanelAllowed={isDualPanelAllowed}
          onClose={closeContextMenu}
          onPin={() => {
            pinTab(contextMenu.tabId!, currentPanelId)
            closeContextMenu()
          }}
          onUnpin={() => {
            unpinTab(contextMenu.tabId!, currentPanelId)
            closeContextMenu()
          }}
          onCloseOthers={() => {
            closeOtherTabs(contextMenu.tabId!, currentPanelId)
            closeContextMenu()
          }}
          onCloseAll={() => {
            closeAllTabs(currentPanelId)
            closeContextMenu()
          }}
          onSplit={() => {
            const tab = tabs.find(t => t.id === contextMenu.tabId)
            if (tab && tabs.length > 1) {
              createPanel(tab)
            }
            closeContextMenu()
          }}
        />
      )}
    </div>
  )
}

/**
 * 드래그 가능한 탭 아이템
 */
interface SortableTabItemProps {
  tab: Tab
  isActive: boolean
  onClick: () => void
  onClose: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function SortableTabItem({ tab, isActive, onClick, onClose, onContextMenu }: SortableTabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const menu = getMenuById(tab.id)
  const Icon = menu?.icon

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center h-9 cursor-pointer
        border-t border-x rounded-t-lg text-sm select-none flex-shrink-0
        ${isActive
          ? 'bg-[#1a2867] border-[#1a2867] text-white font-medium -mb-px'
          : 'bg-white border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className={`p-1 cursor-grab active:cursor-grabbing touch-none ${isActive ? 'text-white/60 hover:text-white' : 'text-gray-300 hover:text-gray-500'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* 고정 아이콘 */}
      {tab.isPinned && (
        <Pin className="w-3 h-3 text-blue-500 -rotate-45 mr-1" />
      )}

      {/* 메뉴 아이콘 */}
      {Icon && !tab.isPinned && (
        <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-white' : ''}`} />
      )}

      {/* 탭 라벨 */}
      <span className="whitespace-nowrap max-w-[100px] truncate pr-1">
        {tab.label}
      </span>

      {/* 닫기 버튼 (고정 탭이 아닐 때만) */}
      {!tab.isPinned && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className={`
            p-0.5 mr-1 rounded
            ${isActive
              ? 'opacity-100 text-white/60 hover:text-white hover:bg-white/20'
              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'}
          `}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/**
 * 컨텍스트 메뉴 (우클릭)
 */
interface ContextMenuProps {
  x: number
  y: number
  tab: Tab
  panelId: string
  isDualPanelAllowed: boolean
  onClose: () => void
  onPin: () => void
  onUnpin: () => void
  onCloseOthers: () => void
  onCloseAll: () => void
  onSplit: () => void
}

function ContextMenu({
  x,
  y,
  tab,
  panelId,
  isDualPanelAllowed,
  onClose,
  onPin,
  onUnpin,
  onCloseOthers,
  onCloseAll,
  onSplit,
}: ContextMenuProps) {
  const { closeTab, hasTwoPanels, getPanel } = useAdminTabStore()
  const panel = getPanel(panelId)
  const tabs = panel?.tabs || []

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 고정/고정 해제 */}
      {tab.isPinned ? (
        <MenuItem onClick={onUnpin}>
          <Pin className="w-4 h-4" />
          고정 해제
        </MenuItem>
      ) : (
        <MenuItem onClick={onPin}>
          <Pin className="w-4 h-4 -rotate-45" />
          탭 고정
        </MenuItem>
      )}

      {/* 새 패널에서 열기 (2패널이 아닐 때만, 데스크톱에서만) */}
      {!hasTwoPanels() && tabs.length > 1 && isDualPanelAllowed && (
        <MenuItem onClick={onSplit}>
          <Columns2 className="w-4 h-4" />
          새 패널에서 열기
        </MenuItem>
      )}

      <div className="border-t border-gray-100 my-1" />

      {/* 닫기 (고정 탭이 아닐 때만) */}
      {!tab.isPinned && (
        <MenuItem onClick={() => { closeTab(tab.id, panelId); onClose() }}>
          <X className="w-4 h-4" />
          탭 닫기
        </MenuItem>
      )}

      {/* 다른 탭 닫기 */}
      <MenuItem
        onClick={onCloseOthers}
        disabled={tabs.length <= 1}
      >
        다른 탭 모두 닫기
      </MenuItem>

      {/* 모든 탭 닫기 */}
      <MenuItem onClick={onCloseAll}>
        모든 탭 닫기
      </MenuItem>
    </div>
  )
}

/**
 * 컨텍스트 메뉴 아이템
 */
interface MenuItemProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

function MenuItem({ children, onClick, disabled }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
        ${disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </button>
  )
}
