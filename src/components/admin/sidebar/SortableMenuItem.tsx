/**
 * 드래그 가능한 메뉴 아이템 (루트 레벨)
 *
 * useSortable 훅으로 드래그앤드롭 지원
 * 더블클릭으로 이름 변경 (admin만)
 * 클릭 시 탭 열기
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAdminTabStore, selectActivePanelTabs } from '@/stores/useAdminTabStore'
import InlineRenameInput from './FolderRenameInput'
import type { ResolvedMenuItem, DragItemData } from '@/lib/sidebar/types'

interface SortableMenuItemProps {
  item: ResolvedMenuItem
  isActive: boolean
  isCollapsed: boolean
  isEditable: boolean
  onMobileClick: () => void
  onContextMenu: (e: React.MouseEvent, menuId: string) => void
  onRenameMenu: (menuId: string, newLabel: string) => void
}

export default function SortableMenuItem({
  item,
  isActive,
  isCollapsed,
  isEditable,
  onMobileClick,
  onContextMenu,
  onRenameMenu,
}: SortableMenuItemProps) {
  const tabs = useAdminTabStore(selectActivePanelTabs)
  const { openTab, setActiveTab } = useAdminTabStore()
  const router = useRouter()
  const [isRenaming, setIsRenaming] = useState(false)

  // 컨텍스트 메뉴에서 "이름 변경" 클릭 시 커스텀 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ menuId: string }>).detail
      if (detail.menuId === item.id) {
        setIsRenaming(true)
      }
    }
    window.addEventListener('sidebar-rename-menu', handler)
    return () => window.removeEventListener('sidebar-rename-menu', handler)
  }, [item.id])

  const dragData: DragItemData = {
    type: 'menu',
    containerId: null, // 루트 레벨
    menuId: item.id,
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: dragData,
    disabled: !isEditable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto' as const,
  }

  const handleClick = () => {
    if (isRenaming) return
    // 외부 URL이면 새 탭으로 열기 (어드민 탭 생성 안 함)
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer')
      onMobileClick()
      return
    }
    const existingTab = tabs.find(t => t.id === item.id)
    if (existingTab) {
      setActiveTab(item.id)
      router.push(existingTab.currentPath || item.href)
    } else {
      openTab({ id: item.id, label: item.label, href: item.href })
      router.push(item.href)
    }
    onMobileClick()
  }

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsRenaming(true)
    }
  }

  const handleRenameConfirm = (newLabel: string) => {
    onRenameMenu(item.id, newLabel)
    setIsRenaming(false)
  }

  const Icon = item.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-1 px-2 py-2 rounded-lg text-xs
        ${isActive
          ? 'bg-[#1a2867] text-white font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
        ${isDragging ? 'shadow-lg bg-white' : ''}
      `}
      onContextMenu={(e) => {
        if (isEditable) {
          e.preventDefault()
          onContextMenu(e, item.id)
        }
      }}
    >
      {/* 드래그 핸들 (admin만 표시) */}
      {isEditable && (
        <button
          {...attributes}
          {...listeners}
          className={`p-0.5 -ml-1 cursor-grab active:cursor-grabbing touch-none ${
            isActive ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
          aria-label="메뉴 순서 변경"
        >
          <GripVertical className="w-3 h-3" />
        </button>
      )}

      {/* 메뉴 버튼 */}
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
        {!isCollapsed && (
          isRenaming ? (
            <InlineRenameInput
              currentName={item.label}
              onConfirm={handleRenameConfirm}
              onCancel={() => setIsRenaming(false)}
            />
          ) : (
            <span className="whitespace-nowrap overflow-hidden">
              {item.label}
            </span>
          )
        )}
      </button>
    </div>
  )
}
