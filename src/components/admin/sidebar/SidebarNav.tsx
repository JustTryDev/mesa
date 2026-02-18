/**
 * 사이드바 네비게이션 영역
 *
 * 멀티 컨테이너 드래그앤드롭:
 * - 루트: 메뉴 + 폴더 순서 변경
 * - 폴더 내: 메뉴 순서 변경
 * - 루트 → 폴더: 메뉴를 폴더에 넣기
 * - 폴더 → 루트: 메뉴를 폴더에서 빼기
 *
 * 핵심 전략:
 * 드래그 중에는 ref로 상태를 관리하고,
 * dragEnd 시에만 store를 업데이트합니다.
 */
'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FolderPlus, Star } from 'lucide-react'
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useAdminTabStore, selectActiveTabId, selectActivePanelTabs } from '@/stores/useAdminTabStore'
import { useSidebarConfigStore } from '@/stores/useSidebarConfigStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useAuth } from '@/contexts/AuthContext'
import SortableMenuItem from './SortableMenuItem'
import SortableFolder from './SortableFolder'
import SidebarContextMenu from './SidebarContextMenu'
import FolderRenameInput from './FolderRenameInput'
import type {
  SidebarConfig,
  SidebarItem,
  SidebarFolder,
  SidebarContextMenuState,
  DragItemData,
} from '@/lib/sidebar/types'
import { ADMIN_MENUS } from '@/lib/constants/adminMenus'

interface SidebarNavProps {
  isCollapsed: boolean
  onMobileClick: () => void
}

/**
 * 커스텀 충돌 감지: pointerWithin 기반 + 타입별 우선순위
 *
 * 문제: 폴더의 useSortable 영역(헤더+자식 전체)과
 *       자식 메뉴의 useSortable 영역이 중첩되어
 *       pointerWithin이 잘못된 폴더를 over로 반환할 수 있음.
 *
 * 해결: 충돌 목록에서 더 구체적인 타겟을 우선 선택
 *       - 메뉴 드래그: menu(자식) > folder-drop(헤더) > folder(전체)
 *       - 폴더 드래그: menu > folder(sortable) > folder-drop(무시)
 *         → 폴더끼리는 루트 레벨 순서 변경만 가능하므로 folder-drop 무시
 */
const customCollisionDetection: CollisionDetection = (args) => {
  const collisions = pointerWithin(args)
  if (collisions.length <= 1) return collisions

  // 드래그 중인 아이템 자체는 제외
  const filtered = collisions.filter(c => c.id !== args.active.id)
  if (filtered.length <= 1) return filtered.length ? filtered : collisions

  // 드래그 중인 아이템이 폴더인지 확인
  const activeData = args.active.data.current as DragItemData | undefined
  const isActiveFolder = activeData?.type === 'folder'

  // 타입별 우선순위: 구체적인(깊은) 타겟일수록 높은 우선순위
  const priority = (id: string | number) => {
    const container = args.droppableContainers.find(c => c.id === id)
    const data = container?.data?.current as Record<string, unknown> | undefined
    if (data?.type === 'menu') return 3       // 폴더 내부 메뉴 (가장 구체적)
    // 폴더를 드래그 중이면: folder-drop 무시하고 folder sortable 우선
    // (폴더는 다른 폴더 안에 넣을 수 없으므로, 루트 레벨 순서 변경용)
    if (data?.type === 'folder-drop') return isActiveFolder ? 0 : 2
    if (data?.type === 'folder') return isActiveFolder ? 2 : 1
    return 0
  }

  return [...filtered].sort((a, b) => priority(b.id) - priority(a.id))
}

// 메뉴 ID로 어느 컨테이너에 속하는지 찾기
function findContainerId(config: SidebarConfig, itemId: string): string | null {
  for (const item of config.items) {
    if (item.type === 'menu' && item.menuId === itemId) return 'root'
    if (item.type === 'folder') {
      if (item.id === itemId) return 'root' // 폴더 자체는 루트
      if (item.children.includes(itemId)) return item.id
    }
  }
  return null
}

// config에서 아이템 제거 (루트 또는 폴더 내부)
function removeItemFromConfig(config: SidebarConfig, menuId: string): SidebarItem[] {
  return config.items
    .filter(item => !(item.type === 'menu' && item.menuId === menuId))
    .map(item => {
      if (item.type === 'folder') {
        return { ...item, children: item.children.filter(id => id !== menuId) }
      }
      return item
    })
}

export default function SidebarNav({ isCollapsed, onMobileClick }: SidebarNavProps) {
  const { isAdmin, hasMenuAccess } = useAuth()
  const activeTabId = useAdminTabStore(selectActiveTabId)
  const tabs = useAdminTabStore(selectActivePanelTabs)
  const { openTab, setActiveTab } = useAdminTabStore()
  const router = useRouter()
  const { config, getResolvedItems, applyDragResult, createFolder, deleteFolder, renameMenu, resetMenuLabel, extractFromFolder } = useSidebarConfigStore()
  const { favorites, isLoaded: isFavoritesLoaded, fetchFavorites, toggleFavorite, isFavorite } = useFavoritesStore()

  // 즐겨찾기 초기 로드
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const isEditable = isAdmin

  // 드래그 중 임시 config (ref로 관리하여 리렌더 방지)
  const workingConfigRef = useRef<SidebarConfig | null>(null)
  // 드래그 중 렌더링용 config (state)
  const [dragConfig, setDragConfig] = useState<SidebarConfig | null>(null)

  // 현재 렌더링에 사용할 config
  const activeConfig = dragConfig || config

  // 드래그 상태
  const [activeId, setActiveId] = useState<string | null>(null)

  // 새 폴더 생성 모드
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<SidebarContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetType: null,
    targetId: null,
  })

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // config → 렌더링용 아이템 변환
  const resolveConfigToItems = useCallback((cfg: SidebarConfig) => {
    const labels = cfg.labels
    return cfg.items
      .map((item) => {
        if (item.type === 'menu') {
          const menu = ADMIN_MENUS.find(m => m.id === item.menuId)
          if (!menu) return null
          return {
            type: 'menu' as const,
            item: { id: menu.id, label: labels?.[menu.id] || menu.label, href: menu.href, icon: menu.icon, group: menu.group, externalUrl: menu.externalUrl },
          }
        } else {
          const children = item.children
            .map(childId => {
              const menu = ADMIN_MENUS.find(m => m.id === childId)
              if (!menu) return null
              return { id: menu.id, label: labels?.[menu.id] || menu.label, href: menu.href, icon: menu.icon, group: menu.group, externalUrl: menu.externalUrl }
            })
            .filter(Boolean) as Array<{ id: string; label: string; href: string; icon: typeof ADMIN_MENUS[0]['icon']; group?: string }>
          return { type: 'folder' as const, id: item.id, name: item.name, children }
        }
      })
      .filter(Boolean) as ReturnType<typeof getResolvedItems>
  }, [])

  // 해석된 아이템
  const resolvedItems = useMemo(() => {
    if (!activeConfig) return []
    return resolveConfigToItems(activeConfig)
  }, [activeConfig, resolveConfigToItems])

  // 권한 기반 필터링
  const visibleItems = useMemo(() => {
    if (isAdmin) return resolvedItems
    return resolvedItems
      .map(item => {
        if (item.type === 'menu') {
          return hasMenuAccess(item.item.id) ? item : null
        }
        const visibleChildren = item.children.filter(c => hasMenuAccess(c.id))
        if (visibleChildren.length === 0) return null
        return { ...item, children: visibleChildren }
      })
      .filter(Boolean) as typeof resolvedItems
  }, [isAdmin, resolvedItems, hasMenuAccess])

  // 최상위 레벨의 sortable ID 목록
  const topLevelIds = useMemo(() =>
    visibleItems.map(item =>
      item.type === 'menu' ? item.item.id : item.id
    ),
    [visibleItems]
  )

  // === 드래그 이벤트 핸들러 ===

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!config) return
    setActiveId(event.active.id as string)
    // 드래그 시작 시 현재 config를 복사
    workingConfigRef.current = JSON.parse(JSON.stringify(config))
    setDragConfig(JSON.parse(JSON.stringify(config)))
  }, [config])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const wc = workingConfigRef.current
    if (!wc) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as DragItemData | undefined
    const overData = over.data.current as Record<string, unknown> | undefined
    if (!activeData || !overData) return

    // 폴더는 다른 폴더 안에 넣을 수 없음
    if (activeData.type === 'folder') return

    const activeMenuId = activeData.menuId
    if (!activeMenuId) return

    // 현재 컨테이너 찾기
    const activeContainer = findContainerId(wc, activeMenuId)
    if (!activeContainer) return

    // === 폴더 헤더 드롭 영역 (folder-drop) 처리 ===
    // 폴더 헤더 위에 직접 드롭하는 경우 → 해당 폴더 안으로 이동
    if (overData.type === 'folder-drop') {
      const targetFolderId = overData.folderId as string

      // 이미 같은 폴더 안에 있으면 무시
      if (activeContainer === targetFolderId) return

      const itemsAfterRemove = removeItemFromConfig(wc, activeMenuId)
      const newItems = itemsAfterRemove.map(item => {
        if (item.type === 'folder' && item.id === targetFolderId) {
          return { ...item, children: [...item.children, activeMenuId] }
        }
        return item
      })

      const newConfig = { items: newItems }
      workingConfigRef.current = newConfig
      setDragConfig(newConfig)
      return
    }

    // === 기존 로직: 메뉴/폴더(sortable) 위 드래그 ===
    const overItemId = over.id as string

    // over 대상이 폴더 sortable인지 확인 (전체 영역)
    const isOverAFolder = overData.type === 'folder'
    const overContainer = findContainerId(wc, overItemId)

    if (!overContainer) return

    // 같은 컨테이너 내 이동은 dragEnd에서 처리
    const activeActualContainer = activeContainer === 'root' ? 'root' : activeContainer
    const overActualContainer = isOverAFolder ? overItemId : (overContainer === 'root' ? 'root' : overContainer)

    if (activeActualContainer === overActualContainer) return

    // === 컨테이너 간 이동 ===

    // 1단계: 원래 위치에서 제거
    const itemsAfterRemove = removeItemFromConfig(wc, activeMenuId)

    // 2단계: 새 위치에 삽입
    let newItems: SidebarItem[]

    if (isOverAFolder) {
      // 폴더 본체(sortable) 위 = 루트 레벨에서 해당 폴더 뒤에 배치
      // (폴더 안에 넣으려면 폴더 헤더(folder-drop) 위에 드롭해야 함)
      const overIdx = itemsAfterRemove.findIndex(item =>
        item.type === 'folder' && item.id === overItemId
      )
      const insertIdx = overIdx >= 0 ? overIdx + 1 : itemsAfterRemove.length
      newItems = [
        ...itemsAfterRemove.slice(0, insertIdx),
        { type: 'menu' as const, menuId: activeMenuId },
        ...itemsAfterRemove.slice(insertIdx),
      ]
    } else if (overActualContainer !== 'root') {
      // 메뉴 → 다른 폴더 내부 (over 아이템 위치에 삽입)
      newItems = itemsAfterRemove.map(item => {
        if (item.type === 'folder' && item.id === overActualContainer) {
          const idx = item.children.indexOf(overItemId)
          const newChildren = [...item.children]
          newChildren.splice(idx >= 0 ? idx : newChildren.length, 0, activeMenuId)
          return { ...item, children: newChildren }
        }
        return item
      })
    } else {
      // 메뉴 → 루트 (over 아이템 위치에 삽입)
      const overIdx = itemsAfterRemove.findIndex(item =>
        item.type === 'menu' ? item.menuId === overItemId : item.id === overItemId
      )
      const insertIdx = overIdx >= 0 ? overIdx : itemsAfterRemove.length
      newItems = [
        ...itemsAfterRemove.slice(0, insertIdx),
        { type: 'menu' as const, menuId: activeMenuId },
        ...itemsAfterRemove.slice(insertIdx),
      ]
    }

    const newConfig = { items: newItems }
    workingConfigRef.current = newConfig
    setDragConfig(newConfig)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const wc = workingConfigRef.current
    setActiveId(null)
    workingConfigRef.current = null

    if (!wc) {
      setDragConfig(null)
      return
    }

    const { active, over } = event

    if (!over || active.id === over.id) {
      // 이동 없음 - 컨테이너 간 이동이 이미 있었으면 그대로 적용
      if (dragConfig) {
        applyDragResult(wc)
      }
      setDragConfig(null)
      return
    }

    const activeData = active.data.current as DragItemData | undefined
    const overData = over.data.current as DragItemData | undefined

    if (!activeData || !overData) {
      if (dragConfig) applyDragResult(wc)
      setDragConfig(null)
      return
    }

    // 같은 컨테이너 내 순서 변경
    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainerId(wc, activeId)
    const overContainer = findContainerId(wc, overId)

    if (activeContainer && overContainer && activeContainer === overContainer) {
      if (activeContainer === 'root') {
        // 루트 레벨 순서 변경
        const oldIndex = wc.items.findIndex(item =>
          item.type === 'menu' ? item.menuId === activeId : item.id === activeId
        )
        const newIndex = wc.items.findIndex(item =>
          item.type === 'menu' ? item.menuId === overId : item.id === overId
        )

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newItems = arrayMove(wc.items, oldIndex, newIndex)
          applyDragResult({ items: newItems })
          setDragConfig(null)
          return
        }
      } else {
        // 폴더 내 순서 변경
        const newItems = wc.items.map(item => {
          if (item.type === 'folder' && item.id === activeContainer) {
            const oldIndex = item.children.indexOf(activeId)
            const newIndex = item.children.indexOf(overId)
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              return { ...item, children: arrayMove(item.children, oldIndex, newIndex) }
            }
          }
          return item
        })
        applyDragResult({ items: newItems })
        setDragConfig(null)
        return
      }
    }

    // 컨테이너 간 이동은 onDragOver에서 이미 처리됨
    applyDragResult(wc)
    setDragConfig(null)
  }, [dragConfig, applyDragResult])

  // === 컨텍스트 메뉴 ===

  const handleFolderContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'folder',
      targetId: folderId,
    })
  }, [])

  const handleMenuContextMenu = useCallback((e: React.MouseEvent, menuId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'menu',
      targetId: menuId,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

  // === 폴더 생성/삭제/이름변경 ===

  const handleCreateFolder = useCallback((name: string) => {
    createFolder(name)
    setIsCreatingFolder(false)
  }, [createFolder])

  const handleDeleteFolder = useCallback((folderId: string) => {
    if (window.confirm('폴더를 삭제하시겠습니까?\n내부 메뉴는 폴더 밖으로 이동됩니다.')) {
      deleteFolder(folderId)
    }
  }, [deleteFolder])

  const handleRenameFolder = useCallback((folderId: string) => {
    // SortableFolder에서 인라인 리네임 처리 (커스텀 이벤트)
    const event = new CustomEvent('sidebar-rename-folder', { detail: { folderId } })
    window.dispatchEvent(event)
  }, [])

  const handleRenameMenu = useCallback((menuId: string) => {
    // 메뉴 아이템에서 인라인 리네임 처리 (커스텀 이벤트)
    const event = new CustomEvent('sidebar-rename-menu', { detail: { menuId } })
    window.dispatchEvent(event)
  }, [])

  const handleResetMenuLabel = useCallback((menuId: string) => {
    resetMenuLabel(menuId)
  }, [resetMenuLabel])

  const handleExtractFromFolder = useCallback((menuId: string) => {
    extractFromFolder(menuId)
  }, [extractFromFolder])

  const handleToggleFavorite = useCallback((menuId: string) => {
    toggleFavorite(menuId)
  }, [toggleFavorite])

  // 즐겨찾기 메뉴 클릭 핸들러
  const handleFavoriteClick = useCallback((menu: typeof ADMIN_MENUS[0]) => {
    if (menu.externalUrl) {
      window.open(menu.externalUrl, '_blank', 'noopener,noreferrer')
      onMobileClick()
      return
    }
    const existingTab = tabs.find(t => t.id === menu.id)
    if (existingTab) {
      setActiveTab(menu.id)
      router.push(existingTab.currentPath || menu.href)
    } else {
      openTab({ id: menu.id, label: menu.label, href: menu.href })
      router.push(menu.href)
    }
    onMobileClick()
  }, [tabs, setActiveTab, openTab, router, onMobileClick])

  // 즐겨찾기 메뉴 아이템 목록
  const favoriteMenus = useMemo(() => {
    if (!isFavoritesLoaded || favorites.length === 0) return []
    return favorites
      .map(id => ADMIN_MENUS.find(m => m.id === id))
      .filter(Boolean) as typeof ADMIN_MENUS
  }, [favorites, isFavoritesLoaded])

  // 드래그 중인 아이템 정보 (오버레이용)
  const activeItem = useMemo(() => {
    if (!activeId) return null
    for (const item of visibleItems) {
      if (item.type === 'menu' && item.item.id === activeId) {
        return { type: 'menu' as const, item: item.item }
      }
      if (item.type === 'folder') {
        if (item.id === activeId) {
          return { type: 'folder' as const, name: item.name }
        }
        const child = item.children.find(c => c.id === activeId)
        if (child) {
          return { type: 'menu' as const, item: child }
        }
      }
    }
    return null
  }, [activeId, visibleItems])

  // 측정 전략 (드래그 중 리렌더 시 위치 재측정)
  const measuring = useMemo(() => ({
    droppable: { strategy: MeasuringStrategy.Always },
  }), [])

  return (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {/* 즐겨찾기 섹션 */}
      {favoriteMenus.length > 0 && (
        <div className="mb-1">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            <Star className="w-3 h-3" />
            {!isCollapsed && <span>즐겨찾기</span>}
          </div>
          {/* 즐겨찾기 메뉴 아이템 */}
          {favoriteMenus.map((menu) => {
            const Icon = menu.icon
            const isActive = activeTabId === menu.id
            return (
              <div
                key={`fav-${menu.id}`}
                className={`
                  flex items-center gap-2 px-2 py-2 rounded-lg text-xs cursor-pointer
                  ${isActive
                    ? 'bg-[#1a2867] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => handleFavoriteClick(menu)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleMenuContextMenu(e, menu.id)
                }}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{config?.labels?.[menu.id] || menu.label}</span>
                )}
              </div>
            )
          })}
          {/* 구분선 */}
          <div className="border-t border-gray-100 mt-1 mb-0.5" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={measuring}
      >
        <SortableContext
          items={topLevelIds}
          strategy={verticalListSortingStrategy}
        >
          {visibleItems.map((item) => {
            if (item.type === 'menu') {
              return (
                <SortableMenuItem
                  key={item.item.id}
                  item={item.item}
                  isActive={activeTabId === item.item.id}
                  isCollapsed={isCollapsed}
                  isEditable={isEditable}
                  onMobileClick={onMobileClick}
                  onContextMenu={handleMenuContextMenu}
                  onRenameMenu={renameMenu}
                />
              )
            }
            return (
              <SortableFolder
                key={item.id}
                folder={item}
                isCollapsed={isCollapsed}
                isEditable={isEditable}
                onMobileClick={onMobileClick}
                onContextMenu={handleFolderContextMenu}
                onMenuContextMenu={handleMenuContextMenu}
                onRenameMenu={renameMenu}
              />
            )
          })}
        </SortableContext>

        {/* 드래그 오버레이 */}
        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="px-2 py-2 rounded-lg text-xs bg-white shadow-lg border border-gray-200 flex items-center gap-2 opacity-90">
              {activeItem.type === 'menu' ? (
                <>
                  <activeItem.item.icon className="w-4 h-4 text-gray-600" />
                  <span>{activeItem.item.label}</span>
                </>
              ) : (
                <span>{activeItem.name}</span>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 새 폴더 생성 */}
      {isEditable && (
        <div className="pt-1">
          {isCreatingFolder ? (
            <div className="px-2 py-1">
              <FolderRenameInput
                currentName=""
                onConfirm={handleCreateFolder}
                onCancel={() => setIsCreatingFolder(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              {!isCollapsed && <span>새 폴더</span>}
            </button>
          )}
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      <SidebarContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameMenu={handleRenameMenu}
        onResetMenuLabel={handleResetMenuLabel}
        onToggleFavorite={handleToggleFavorite}
        onExtractFromFolder={handleExtractFromFolder}
        hasCustomLabel={contextMenu.targetType === 'menu' && !!config?.labels?.[contextMenu.targetId || '']}
        isFavorite={contextMenu.targetType === 'menu' && isFavorite(contextMenu.targetId || '')}
        isInsideFolder={
          contextMenu.targetType === 'menu' && !!config?.items.some(
            item => item.type === 'folder' && item.children.includes(contextMenu.targetId || '')
          )
        }
      />
    </nav>
  )
}
