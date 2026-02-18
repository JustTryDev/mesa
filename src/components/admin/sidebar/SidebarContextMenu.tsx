/**
 * 사이드바 컨텍스트 메뉴 (우클릭 메뉴)
 *
 * 폴더 우클릭: 이름 변경 / 폴더 삭제
 * 메뉴 우클릭: 이름 변경 / 기본 이름 복원
 */
'use client'

import { useEffect, useRef } from 'react'
import { Pencil, Trash2, RotateCcw, Star, StarOff, FolderOutput } from 'lucide-react'
import type { SidebarContextMenuState } from '@/lib/sidebar/types'

interface SidebarContextMenuProps {
  state: SidebarContextMenuState
  onClose: () => void
  onRenameFolder: (folderId: string) => void
  onDeleteFolder: (folderId: string) => void
  onRenameMenu: (menuId: string) => void
  onResetMenuLabel: (menuId: string) => void
  onToggleFavorite: (menuId: string) => void
  onExtractFromFolder: (menuId: string) => void
  hasCustomLabel: boolean // 메뉴에 커스텀 라벨이 설정되어 있는지
  isFavorite: boolean // 즐겨찾기 여부
  isInsideFolder: boolean // 메뉴가 폴더 안에 있는지
}

export default function SidebarContextMenu({
  state,
  onClose,
  onRenameFolder,
  onDeleteFolder,
  onRenameMenu,
  onResetMenuLabel,
  onToggleFavorite,
  onExtractFromFolder,
  hasCustomLabel,
  isFavorite,
  isInsideFolder,
}: SidebarContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    if (!state.isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 약간의 딜레이로 우클릭 이벤트와 충돌 방지
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state.isOpen, onClose])

  if (!state.isOpen || !state.targetId) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{ left: state.x, top: state.y }}
    >
      {/* 폴더 컨텍스트 메뉴 */}
      {state.targetType === 'folder' && (
        <>
          <button
            onClick={() => {
              onRenameFolder(state.targetId!)
              onClose()
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            이름 변경
          </button>
          <button
            onClick={() => {
              onDeleteFolder(state.targetId!)
              onClose()
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            폴더 삭제
          </button>
        </>
      )}

      {/* 메뉴 컨텍스트 메뉴 */}
      {state.targetType === 'menu' && (
        <>
          {/* 즐겨찾기 토글 */}
          <button
            onClick={() => {
              onToggleFavorite(state.targetId!)
              onClose()
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            {isFavorite ? (
              <>
                <StarOff className="w-3.5 h-3.5" />
                즐겨찾기 제거
              </>
            ) : (
              <>
                <Star className="w-3.5 h-3.5" />
                즐겨찾기 추가
              </>
            )}
          </button>
          {/* 폴더에서 꺼내기 (폴더 안에 있는 메뉴만 표시) */}
          {isInsideFolder && (
            <button
              onClick={() => {
                onExtractFromFolder(state.targetId!)
                onClose()
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <FolderOutput className="w-3.5 h-3.5" />
              폴더에서 꺼내기
            </button>
          )}
          <div className="border-t border-gray-100 my-0.5" />
          <button
            onClick={() => {
              onRenameMenu(state.targetId!)
              onClose()
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            이름 변경
          </button>
          {hasCustomLabel && (
            <button
              onClick={() => {
                onResetMenuLabel(state.targetId!)
                onClose()
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              기본 이름 복원
            </button>
          )}
        </>
      )}
    </div>
  )
}
