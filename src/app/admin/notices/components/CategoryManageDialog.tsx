/**
 * 카테고리 관리 Dialog
 * 공지사항 페이지에서 카테고리를 추가/수정/삭제할 수 있는 모달
 */
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CategoryList from '@/app/admin/categories/components/CategoryList'
import type { NoticeCategory } from '@/types/notice'

interface CategoryManageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: NoticeCategory[]
  isLoading: boolean
  onAdd: (name: string) => Promise<NoticeCategory | null>
  onUpdate: (id: string, name: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

export default function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
          <DialogDescription>
            공지사항 카테고리를 추가하고 관리합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 기존 CategoryList 컴포넌트 재사용 */}
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />

        {/* 안내 문구 */}
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          <strong>참고:</strong> 카테고리를 삭제하면 해당 카테고리의 공지사항은
          &quot;카테고리 없음&quot; 상태가 됩니다. 공지사항은 삭제되지 않습니다.
        </p>
      </DialogContent>
    </Dialog>
  )
}
