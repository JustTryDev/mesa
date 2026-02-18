/**
 * 공지사항 목록 테이블 컴포넌트
 * useTableSettings 기반 (칼럼 리사이즈/리오더/숨기기 지원)
 */
'use client'

import { useState } from 'react'
import { Eye, EyeOff, Pin, Trash2, GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { NoticeWithCategory } from '@/types/notice'
import type { ColumnDef } from '@/hooks/useTableSettings'
import { getNoticeStatus, NOTICE_STATUS_CONFIG } from '@/lib/constants/notice-constants'
import { formatDateDot } from '@/lib/format'

interface NoticeTableProps {
  notices: NoticeWithCategory[]
  isLoading: boolean
  onDelete: (id: string) => Promise<boolean>
  onTogglePublish: (id: string, isPublished: boolean) => Promise<boolean>
  onTogglePin: (id: string, isPinned: boolean) => Promise<boolean>
  /** 수정 모달 열기 콜백 */
  onEdit: (notice: NoticeWithCategory) => void
  /** 테이블 설정 (useTableSettings에서 전달) */
  tableSettings: {
    columnWidths: Record<string, number>
    visibleColumns: ColumnDef[]
    totalWidth: number
    handleResizeMouseDown: (e: React.MouseEvent, columnKey: string) => void
    handleDragStart: (columnKey: string) => void
    handleDragOver: (e: React.DragEvent, columnKey: string) => void
    handleDrop: (targetKey: string) => void
    handleDragEnd: () => void
    draggedColumn: string | null
    dragOverColumn: string | null
  }
  /** 정렬 상태 */
  sort?: { field: string; direction: 'asc' | 'desc' }
  /** 정렬 변경 핸들러 */
  onSort?: (field: string) => void
}

export default function NoticeTable({
  notices,
  isLoading,
  onDelete,
  onTogglePublish,
  onTogglePin,
  onEdit,
  tableSettings,
  sort,
  onSort,
}: NoticeTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    await onDelete(deleteId)
    setIsDeleting(false)
    setDeleteId(null)
  }

  // 정렬 아이콘
  const renderSortIcon = (sortField?: string) => {
    if (!sortField || !onSort) return null
    if (!sort || sort.field !== sortField) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />
  }

  // 이벤트 전파 차단
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (notices.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        등록된 공지사항이 없습니다.
      </div>
    )
  }

  // 셀 렌더러
  const renderCell = (col: ColumnDef, notice: NoticeWithCategory) => {
    const status = getNoticeStatus(notice)
    const statusConfig = NOTICE_STATUS_CONFIG[status]

    switch (col.key) {
      case 'status':
        return (
          <td key={col.key} className="px-4 py-3 overflow-hidden" style={{ width: tableSettings.columnWidths[col.key] }}>
            <span
              className={`
                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                ${statusConfig.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                ${statusConfig.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                ${statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}
            >
              {notice.is_pinned && <Pin className="w-3 h-3 mr-1" />}
              {statusConfig.label}
            </span>
          </td>
        )
      case 'title':
        return (
          <td key={col.key} className="px-4 py-3 overflow-hidden" style={{ width: tableSettings.columnWidths[col.key] }}>
            <div className="font-medium text-gray-900 line-clamp-1">{notice.title}</div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{notice.content}</p>
          </td>
        )
      case 'category':
        return (
          <td key={col.key} className="px-4 py-3 overflow-hidden" style={{ width: tableSettings.columnWidths[col.key] }}>
            <span className="text-sm text-gray-600">{notice.category?.name || '-'}</span>
          </td>
        )
      case 'view_count':
        return (
          <td key={col.key} className="px-4 py-3 overflow-hidden" style={{ width: tableSettings.columnWidths[col.key] }}>
            <span className="text-sm text-gray-600">{notice.view_count?.toLocaleString() || 0}</span>
          </td>
        )
      case 'created_at':
        return (
          <td key={col.key} className="px-4 py-3 overflow-hidden" style={{ width: tableSettings.columnWidths[col.key] }}>
            <span className="text-sm text-gray-500">
              {notice.created_at ? formatDateDot(new Date(notice.created_at)) : '-'}
            </span>
          </td>
        )
      case 'actions':
        return (
          <td
            key={col.key}
            className="px-4 py-3 sticky right-0 bg-white shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]"
            style={{ width: tableSettings.columnWidths[col.key] }}
            onClick={stopPropagation}
          >
            <div className="flex items-center justify-center gap-1">
              {/* 상세 보기 */}
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => onEdit(notice)}
                title="상세 보기">
                <Eye className="w-3.5 h-3.5" />
              </Button>
              {/* 고정 토글 */}
              <Button variant="ghost" size="icon"
                className={`h-7 w-7 ${notice.is_pinned ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600 hover:bg-yellow-50`}
                onClick={() => onTogglePin(notice.id, !notice.is_pinned)}
                title={notice.is_pinned ? '고정 해제' : '상단 고정'}>
                <Pin className="w-3.5 h-3.5" />
              </Button>
              {/* 공개/비공개 토글 */}
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => onTogglePublish(notice.id, !notice.is_published)}
                title={notice.is_published ? '비공개로 전환' : '공개로 전환'}>
                {notice.is_published
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye className="w-3.5 h-3.5" />
                }
              </Button>
              {/* 삭제 */}
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteId(notice.id)}
                title="삭제">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </td>
        )
      default:
        return <td key={col.key} className="px-4 py-3">-</td>
    }
  }

  return (
    <>
      <table className="w-full table-fixed text-sm" style={{ minWidth: tableSettings.totalWidth }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              {tableSettings.visibleColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: tableSettings.columnWidths[col.key], minWidth: 60 }}
                  className={`
                    px-4 py-3 whitespace-nowrap select-none relative group text-center
                    ${col.sticky ? 'sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]' : ''}
                    ${col.sortField && onSort ? 'cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors' : ''}
                    ${tableSettings.dragOverColumn === col.key ? 'bg-blue-50 border-l-2 border-blue-400' : ''}
                    ${tableSettings.draggedColumn === col.key ? 'opacity-50' : ''}
                  `}
                  draggable={!col.sticky}
                  onDragStart={() => tableSettings.handleDragStart(col.key)}
                  onDragOver={(e) => tableSettings.handleDragOver(e, col.key)}
                  onDrop={() => tableSettings.handleDrop(col.key)}
                  onDragEnd={tableSettings.handleDragEnd}
                  onClick={col.sortField && onSort ? () => onSort(col.sortField!) : undefined}
                  title={col.sortField ? `${col.label} 정렬` : undefined}
                >
                  <span className="inline-flex items-center">
                    {!col.sticky && (
                      <GripVertical className="w-3 h-3 mr-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
                    )}
                    {col.label}
                    {renderSortIcon(col.sortField)}
                  </span>
                  {/* 리사이즈 핸들 */}
                  {!col.sticky && (
                    <div
                      className="absolute top-0 -right-1.5 h-full w-3 cursor-col-resize z-10 group/resize"
                      onMouseDown={(e) => tableSettings.handleResizeMouseDown(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute right-[5px] top-0 h-full w-px bg-gray-200 group-hover/resize:w-0.5 group-hover/resize:bg-blue-400 transition-all" />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <tr
                key={notice.id}
                className="hover:bg-gray-50/50 cursor-pointer"
                onClick={() => onEdit(notice)}
              >
                {tableSettings.visibleColumns.map(col => renderCell(col, notice))}
              </tr>
            ))}
          </tbody>
      </table>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
