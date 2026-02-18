/**
 * 드래그 가능한 폴더 컴포넌트
 *
 * 두 가지 역할을 분리:
 * - useSortable (외곽 div): 루트 레벨에서 폴더 순서 변경
 * - useDroppable (헤더 div): 메뉴 아이템을 폴더 안으로 드롭하는 대상
 *
 * 이 분리를 통해 드래그 중 포인터가 폴더 영역을 지나갈 때
 * 의도하지 않은 폴더에 아이템이 들어가는 버그를 방지합니다.
 */
'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, FolderClosed, FolderOpen, GripVertical } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAdminTabStore, selectActiveTabId } from '@/stores/useAdminTabStore'
import { useSidebarConfigStore } from '@/stores/useSidebarConfigStore'
import { useAuth } from '@/contexts/AuthContext'
import FolderMenuItem from './FolderMenuItem'
import FolderRenameInput from './FolderRenameInput'
import type { ResolvedFolder, ResolvedMenuItem, DragItemData } from '@/lib/sidebar/types'

interface SortableFolderProps {
  folder: ResolvedFolder
  isCollapsed: boolean
  isEditable: boolean
  onMobileClick: () => void
  onContextMenu: (e: React.MouseEvent, folderId: string) => void
  onMenuContextMenu: (e: React.MouseEvent, menuId: string) => void
  onRenameMenu: (menuId: string, newLabel: string) => void
}

export default function SortableFolder({
  folder,
  isCollapsed,
  isEditable,
  onMobileClick,
  onContextMenu,
  onMenuContextMenu,
  onRenameMenu,
}: SortableFolderProps) {
  const activeTabId = useAdminTabStore(selectActiveTabId)
  const { hasMenuAccess, isAdmin } = useAuth()
  const { isFolderOpen, toggleFolder, renameFolder } = useSidebarConfigStore()
  const [isRenaming, setIsRenaming] = useState(false)

  // 컨텍스트 메뉴에서 "이름 변경" 클릭 시 커스텀 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ folderId: string }>).detail
      if (detail.folderId === folder.id) {
        setIsRenaming(true)
      }
    }
    window.addEventListener('sidebar-rename-folder', handler)
    return () => window.removeEventListener('sidebar-rename-folder', handler)
  }, [folder.id])

  const isOpen = isFolderOpen(folder.id)

  // 권한 기반 메뉴 필터링
  const visibleChildren = isAdmin
    ? folder.children
    : folder.children.filter(child => hasMenuAccess(child.id))

  // 폴더 안에 활성 탭이 있는지 확인
  const hasActiveChild = visibleChildren.some(child => activeTabId === child.id)

  // 폴더 자체의 sortable (순서 변경 + 드롭 대상)
  const dragData: DragItemData = {
    type: 'folder',
    containerId: null,
    folderId: folder.id,
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: dragData,
    disabled: !isEditable,
  })

  // 폴더 헤더 전용 드롭 영역 (메뉴를 폴더 안에 넣기 위한 타겟)
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `folder-drop:${folder.id}`,
    data: {
      type: 'folder-drop',
      folderId: folder.id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto' as const,
  }

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsRenaming(true)
    }
  }

  const handleRenameConfirm = (newName: string) => {
    renameFolder(folder.id, newName)
    setIsRenaming(false)
  }

  // 모든 자식 메뉴에 권한이 없으면 폴더 자체를 숨김
  if (!isAdmin && visibleChildren.length === 0) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'shadow-lg' : ''}
    >
      {/* 폴더 헤더 (드롭 대상) */}
      <div
        ref={setDropRef}
        className={`
          flex items-center gap-1 px-2 py-2 rounded-lg text-xs
          ${isDropOver && !isDragging ? 'ring-1 ring-blue-400 bg-blue-50/50' : ''}
          ${hasActiveChild
            ? 'text-[#1a2867] font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
        onContextMenu={(e) => {
          if (isEditable) {
            e.preventDefault()
            onContextMenu(e, folder.id)
          }
        }}
      >
        {/* 드래그 핸들 (admin만) */}
        {isEditable && (
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 -ml-1 cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600"
            aria-label="폴더 순서 변경"
          >
            <GripVertical className="w-3 h-3" />
          </button>
        )}

        {/* 접기/펼치기 + 아이콘 + 이름 */}
        <button
          onClick={() => toggleFolder(folder.id)}
          onDoubleClick={handleDoubleClick}
          className="flex items-center gap-1 flex-1 min-w-0 text-left"
        >
          <ChevronDown
            className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
          {isOpen
            ? <FolderOpen className="w-4 h-4 flex-shrink-0" />
            : <FolderClosed className="w-4 h-4 flex-shrink-0" />
          }
          {!isCollapsed && (
            isRenaming ? (
              <FolderRenameInput
                currentName={folder.name}
                onConfirm={handleRenameConfirm}
                onCancel={() => setIsRenaming(false)}
              />
            ) : (
              <span className="whitespace-nowrap overflow-hidden">
                {folder.name}
              </span>
            )
          )}
        </button>
      </div>

      {/* 폴더 내부 메뉴 */}
      {isOpen && (
        <div className="space-y-0.5 mt-0.5">
          <SortableContext
            items={visibleChildren.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleChildren.map((child: ResolvedMenuItem) => (
              <FolderMenuItem
                key={child.id}
                item={child}
                folderId={folder.id}
                isActive={activeTabId === child.id}
                isCollapsed={isCollapsed}
                isEditable={isEditable}
                onMobileClick={onMobileClick}
                onContextMenu={onMenuContextMenu}
                onRenameMenu={onRenameMenu}
              />
            ))}
          </SortableContext>

          {/* 빈 폴더 표시 (admin용) */}
          {visibleChildren.length === 0 && isEditable && (
            <div className="pl-6 pr-2 py-1.5 text-xs text-gray-400 italic">
              (비어있음)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
