/**
 * useDragDrop - 파일 매니저 드래그앤드롭 전담 훅
 *
 * @dnd-kit 기반으로 파일/폴더 이동을 처리합니다.
 * - PointerSensor: iframe sandbox에서도 안전하게 동작
 * - pointerWithin: transfer(이동) 패턴에 최적화된 충돌 감지
 * - 다중 선택 드래그: selectedIds에 포함된 항목 드래그 시 전체 이동
 */
'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import type { CustomerFile } from '@/hooks/useFileManager'

// ========================================
// 드래그/드롭 데이터 타입
// ========================================

/** 드래그 아이템에 첨부하는 데이터 */
export interface FileDragData {
  type: 'file-item'
  fileId: string
  isFolder: boolean
}

/** 드롭 타겟에 첨부하는 데이터 */
export interface FileDropData {
  type: 'folder-drop' | 'breadcrumb-drop'
  folderId: string | null  // null = 루트
}

// ========================================
// 훅 본체
// ========================================

interface UseDragDropOptions {
  files: CustomerFile[]
  selectedIds: Set<string>
  currentFolderId: string | null
  onMove: (fileIds: string[], targetFolderId: string | null) => Promise<boolean>
}

export function useDragDrop({ files, selectedIds, currentFolderId, onMove }: UseDragDropOptions) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // 센서: PointerSensor, distance 8로 클릭과 드래그 구분
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // 커스텀 충돌 감지: 브레드크럼 > 폴더 카드 우선
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const collisions = pointerWithin(args)
    if (collisions.length <= 1) return collisions

    // 자기 자신 제외
    const filtered = collisions.filter(c => c.id !== args.active.id)
    if (filtered.length <= 1) return filtered.length ? filtered : collisions

    // 우선순위: 브레드크럼 > 폴더 카드
    const priority = (id: string | number) => {
      const container = args.droppableContainers.find(c => c.id === id)
      const data = container?.data?.current as Record<string, unknown> | undefined
      if (data?.type === 'breadcrumb-drop') return 3
      if (data?.type === 'folder-drop') return 2
      return 0
    }

    return [...filtered].sort((a, b) => priority(b.id) - priority(a.id))
  }, [])

  // 드래그 시작 (data.fileId 사용 → "drag-" 접두어 없는 순수 파일 ID)
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as FileDragData | undefined
    setActiveId(data?.fileId ?? null)
  }, [])

  // 드래그 종료 (이동 실행)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as FileDragData | undefined
    const overData = over.data.current as FileDropData | undefined
    if (!activeData || !overData) return
    if (overData.type !== 'folder-drop' && overData.type !== 'breadcrumb-drop') return

    const targetFolderId = overData.folderId

    // 자기 자신에게 드롭 방지
    if (activeData.fileId === targetFolderId) return
    // 현재 폴더와 같은 브레드크럼으로 드롭 방지
    if (overData.type === 'breadcrumb-drop' && targetFolderId === currentFolderId) return

    // 이동할 파일 ID 결정 (다중 선택이면 선택된 전체, 아니면 드래그한 것만)
    const fileIdsToMove = selectedIds.has(activeData.fileId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [activeData.fileId]

    await onMove(fileIdsToMove, targetFolderId)
  }, [selectedIds, currentFolderId, onMove])

  // 드래그 취소
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  // 드래그 중인 아이템 정보 (DragOverlay용)
  const activeItem = useMemo(() => {
    if (!activeId) return null
    return files.find(f => f.id === activeId) || null
  }, [activeId, files])

  // 다중 선택 드래그 시 선택된 개수
  const dragCount = useMemo(() => {
    if (!activeId) return 0
    if (selectedIds.has(activeId) && selectedIds.size > 1) return selectedIds.size
    return 1
  }, [activeId, selectedIds])

  return {
    sensors,
    collisionDetection,
    activeId,
    activeItem,
    dragCount,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
