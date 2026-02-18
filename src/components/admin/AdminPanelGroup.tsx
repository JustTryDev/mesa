/**
 * Admin 패널 그룹 컴포넌트
 *
 * VS Code 스타일의 듀얼 패널 레이아웃을 관리합니다.
 * - react-resizable-panels를 사용한 리사이즈 기능
 * - 최대 2개 패널 지원
 * - 패널 간 드래그 앤 드롭으로 탭 이동
 * - 우측 가장자리로 드래그하면 새 패널 생성
 * - 1024px 미만에서는 단일 패널 강제
 */
'use client'

import { useState, useCallback, useRef } from 'react'
import { Panel, Group, Separator } from 'react-resizable-panels'
import { useAdminTabStore, Tab } from '@/stores/useAdminTabStore'
import AdminPanel from './AdminPanel'
import IframePool from './IframePool'
import { useResponsivePanel } from '@/hooks/useResponsivePanel'

// 드래그 앤 드롭 관련 import
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { getMenuById } from '@/lib/constants/adminMenus'
import { useAdminHydration } from './AdminHydrationProvider'
import { Columns2 } from 'lucide-react'

interface AdminPanelGroupProps {
  children: React.ReactNode
}

/**
 * 드래그 중인 탭 오버레이 (드래그 미리보기)
 */
function DragPreview({ tabId }: { tabId: string }) {
  const menu = getMenuById(tabId)
  const Icon = menu?.icon

  return (
    <div className="flex items-center h-9 px-3 bg-white border border-blue-400 rounded-lg shadow-lg text-sm">
      {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />}
      <span className="whitespace-nowrap">{menu?.label || tabId}</span>
    </div>
  )
}

/**
 * 우측 분할 드롭존
 *
 * 탭을 여기에 드롭하면 새 패널 생성
 */
function SplitDropZone({ isVisible }: { isVisible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'split-dropzone',
  })

  if (!isVisible) return null

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute right-0 top-0 bottom-0 w-24 z-50
        flex items-center justify-center
        border-l-2 border-dashed
        ${isOver
          ? 'bg-blue-100 border-blue-500'
          : 'bg-blue-50/80 border-blue-300'
        }
      `}
    >
      <div className={`
        flex flex-col items-center gap-2 text-center
        ${isOver ? 'text-blue-600' : 'text-blue-400'}
      `}>
        <Columns2 className="w-8 h-8" />
        <span className="text-xs font-medium">
          새 패널로<br />분할
        </span>
      </div>
    </div>
  )
}

export default function AdminPanelGroup({ children }: AdminPanelGroupProps) {
  const {
    layout,
    setSplitRatio,
    reorderTabs,
    moveTabToPanel,
    createPanel,
    getPanel,
    hasTwoPanels,
    findTabPanel,
  } = useAdminTabStore()

  // 반응형 패널 관리 (모바일에서 듀얼 패널 비활성화)
  const { isDualPanelAllowed } = useResponsivePanel()

  // hydration 상태를 Context에서 가져옴 (rehydrate()는 AdminHydrationProvider에서 1회만 호출)
  const isHydrated = useAdminHydration()

  // 패널별 콘텐츠 영역 DOM ref (IframePool이 좌표 측정에 사용)
  const panelContentRefs = useRef<Record<string, HTMLElement | null>>({})

  // IframePool 오버레이의 좌표 기준점
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [overPanelId, setOverPanelId] = useState<string | null>(null)
  const [showSplitZone, setShowSplitZone] = useState(false)

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 드래그 시작
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveTabId(active.id as string)

    // 단일 패널이고, 탭이 2개 이상이고, 듀얼 패널이 허용될 때만 분할 드롭존 표시
    const isSinglePanel = !hasTwoPanels()
    if (isSinglePanel && isDualPanelAllowed) {
      const panel = findTabPanel(active.id as string)
      if (panel && panel.tabs.length > 1) {
        setShowSplitZone(true)
      }
    }
  }, [hasTwoPanels, findTabPanel, isDualPanelAllowed])

  // 드래그 중 (어느 패널 위에 있는지 감지)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (!over) {
      setOverPanelId(null)
      return
    }

    // over.id에서 패널 ID 추출
    const overId = over.id as string

    if (overId === 'split-dropzone') {
      setOverPanelId(null)
      return
    }

    if (overId.startsWith('panel-dropzone-')) {
      setOverPanelId(overId.replace('panel-dropzone-', ''))
    } else {
      // 탭 위에 있을 때: 해당 탭이 어느 패널에 있는지 찾기
      for (const panel of layout.panels) {
        if (panel.tabs.some(t => t.id === overId)) {
          setOverPanelId(panel.id)
          break
        }
      }
    }
  }, [layout.panels])

  // 드래그 종료
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveTabId(null)
    setOverPanelId(null)
    setShowSplitZone(false)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // 분할 드롭존에 드롭한 경우 → 새 패널 생성
    if (overId === 'split-dropzone') {
      const panel = findTabPanel(activeId)
      if (panel) {
        const tab = panel.tabs.find(t => t.id === activeId)
        if (tab && panel.tabs.length > 1) {
          createPanel(tab)
        }
      }
      return
    }

    // 드래그한 탭이 어느 패널에 있는지 찾기
    let fromPanelId: string | null = null
    for (const panel of layout.panels) {
      if (panel.tabs.some(t => t.id === activeId)) {
        fromPanelId = panel.id
        break
      }
    }

    if (!fromPanelId) return

    // 드롭 대상이 패널 드롭존인 경우
    if (overId.startsWith('panel-dropzone-')) {
      const toPanelId = overId.replace('panel-dropzone-', '')
      if (fromPanelId !== toPanelId) {
        moveTabToPanel(activeId, fromPanelId, toPanelId)
      }
      return
    }

    // 드롭 대상이 다른 탭인 경우
    let toPanelId: string | null = null
    let toIndex: number | null = null

    for (const panel of layout.panels) {
      const tabIndex = panel.tabs.findIndex(t => t.id === overId)
      if (tabIndex !== -1) {
        toPanelId = panel.id
        toIndex = tabIndex
        break
      }
    }

    if (!toPanelId) return

    // 같은 패널 내 이동
    if (fromPanelId === toPanelId) {
      const fromPanel = getPanel(fromPanelId)
      if (!fromPanel) return

      const fromIndex = fromPanel.tabs.findIndex(t => t.id === activeId)
      if (fromIndex !== -1 && toIndex !== null && fromIndex !== toIndex) {
        reorderTabs(fromIndex, toIndex, fromPanelId)
      }
    } else {
      // 다른 패널로 이동
      moveTabToPanel(activeId, fromPanelId, toPanelId, toIndex ?? undefined)
    }
  }, [layout.panels, getPanel, reorderTabs, moveTabToPanel, createPanel, findTabPanel])

  // 드래그 취소
  const handleDragCancel = useCallback(() => {
    setActiveTabId(null)
    setOverPanelId(null)
    setShowSplitZone(false)
  }, [])

  // hydration 전에는 children만 표시
  if (!isHydrated) {
    return <div className="flex-1 flex flex-col min-h-0">{children}</div>
  }

  const isTwoPanels = hasTwoPanels()

  // 첫 번째 패널 (항상 존재)
  const firstPanel = layout.panels[0]
  // 두 번째 패널 (분할 시에만)
  const secondPanel = layout.panels[1]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={containerRef} className="flex-1 flex min-h-0 relative">
        <Group
          orientation="horizontal"
          className="flex-1"
        >
          {/* 첫 번째 패널 (항상 존재) */}
          {firstPanel && (
            <Panel
              defaultSize={isTwoPanels ? layout.splitRatio * 100 : 100}
              minSize={20}
              className="flex flex-col min-h-0"
            >
              <AdminPanel
                panelId={firstPanel.id}
                isActive={layout.activePanelId === firstPanel.id}
                isDragOver={overPanelId === firstPanel.id && activeTabId !== null}
                contentRef={el => { panelContentRefs.current[firstPanel.id] = el }}
              >
                {children}
              </AdminPanel>
            </Panel>
          )}

          {/* 두 번째 패널 (분할 시에만 표시) */}
          {isTwoPanels && secondPanel && (
            <>
              {/* 리사이즈 핸들 */}
              <Separator className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group">
                {/* 핸들 시각적 표시 */}
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/20" />
              </Separator>

              <Panel
                defaultSize={(1 - layout.splitRatio) * 100}
                minSize={20}
                className="flex flex-col min-h-0"
              >
                <AdminPanel
                  panelId={secondPanel.id}
                  isActive={layout.activePanelId === secondPanel.id}
                  isDragOver={overPanelId === secondPanel.id && activeTabId !== null}
                  contentRef={el => { panelContentRefs.current[secondPanel.id] = el }}
                >
                  {children}
                </AdminPanel>
              </Panel>
            </>
          )}
        </Group>

        {/* 우측 분할 드롭존 (드래그 중이고, 단일 패널이고, 듀얼 패널 허용 시에만 표시) */}
        <SplitDropZone isVisible={showSplitZone && !isTwoPanels && isDualPanelAllowed} />

        {/* 중앙 집중식 iframe 관리 - CSS 오버레이로 패널 간 이동 시 iframe 상태 보존 */}
        <IframePool panelContentRefs={panelContentRefs} containerRef={containerRef} />
      </div>

      {/* 드래그 오버레이 (드래그 중인 탭 미리보기) */}
      <DragOverlay>
        {activeTabId ? <DragPreview tabId={activeTabId} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
