/**
 * 공지사항 목록 페이지
 * useTableSettings 기반 (칼럼 리사이즈/리오더/숨기기 지원)
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, FolderOpen, RefreshCw, RotateCcw, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CompactPagination from '@/components/ui/CompactPagination'
import { FloatingScrollbar } from '@/components/ui/FloatingScrollbar'
import { useFloatingScrollbar } from '@/hooks/useFloatingScrollbar'
import ColumnVisibilityPopover from '@/components/ui/ColumnVisibilityPopover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NoticeTable, NoticeForm, CategoryManageDialog } from './components'
import { useNotices, useCategories } from '@/hooks'
import useTableSettings, { type ColumnDef } from '@/hooks/useTableSettings'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_PAGE_SIZE } from '@/lib/constants/notice-constants'
import type { Notice } from '@/types/notice'

// 칼럼 정의 (useTableSettings 호환)
const COLUMNS: ColumnDef[] = [
  { key: 'status', label: '상태' },
  { key: 'title', label: '제목', sortField: 'title' },
  { key: 'category', label: '카테고리' },
  { key: 'view_count', label: '조회', sortField: 'view_count' },
  { key: 'created_at', label: '작성일', sortField: 'created_at' },
  { key: 'actions', label: '관리', sticky: true },
]

// 기본 칼럼 너비
const DEFAULT_WIDTHS: Record<string, number> = {
  status: 100,
  title: 320,
  category: 120,
  view_count: 80,
  created_at: 120,
  actions: 160,
}

export default function AdminNoticesPage() {
  const { user } = useAuth()

  // 플로팅 스크롤바
  const { scrollContainerRef, floatingScrollRef, tableScrollWidth } = useFloatingScrollbar()

  // 테이블 설정 (칼럼 리사이즈/리오더/숨기기)
  const tableSettings = useTableSettings({
    pageId: 'notices',
    columns: COLUMNS,
    defaultWidths: DEFAULT_WIDTHS,
    userId: user?.id,
    requiredColumns: ['actions'],
  })

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [publishedFilter, setPublishedFilter] = useState<string>('')

  const {
    categories,
    isLoading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories()
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const {
    notices,
    isLoading,
    total,
    page,
    totalPages,
    setPage,
    setFilter,
    deleteNotice,
    updateNotice,
    getNotice,
    fetchNotices,
  } = useNotices({
    pageSize: ADMIN_PAGE_SIZE,
  })

  // 정렬 상태
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
  })

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // ── 수정 모달 상태 ──
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Notice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** 수정 모달 열기 — DB에서 전체 데이터 조회 후 모달에 전달 */
  const handleEdit = async (notice: { id: string }) => {
    const data = await getNotice(notice.id)
    if (data) {
      setEditTarget(data)
      setEditOpen(true)
    }
  }

  // 검색 적용
  const handleSearch = () => {
    setFilter({
      search: search || undefined,
      categoryId: categoryFilter || undefined,
      isPublished: publishedFilter === '' ? undefined : publishedFilter === 'true',
    })
  }

  // 필터 초기화
  const handleReset = () => {
    setSearch('')
    setCategoryFilter('')
    setPublishedFilter('')
    setFilter({})
  }

  // 공개 상태 토글
  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    return updateNotice(id, { is_published: isPublished })
  }

  // 고정 상태 토글
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    return updateNotice(id, { is_pinned: isPinned })
  }

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">공지사항 관리</h1>
            <p className="text-sm text-gray-500">총 {total}개의 공지사항</p>
          </div>
        </div>
        {/* 상단 버튼: [새 공지사항] [카테고리 관리] [새로고침] [컬럼가시성] [초기화] */}
        <div className="flex items-center gap-2">
          <Link href="/admin/notices/new">
            <Button className="bg-[#ffd93d] hover:bg-[#ffd93d]/90 text-gray-900" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              새 공지사항
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
            <FolderOpen className="w-4 h-4 mr-1.5" />
            카테고리 관리
          </Button>
          <Button variant="outline" size="icon" onClick={fetchNotices} title="새로고침" className="h-9 w-9">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <ColumnVisibilityPopover
            columns={tableSettings.orderedColumns}
            hiddenColumns={tableSettings.hiddenColumns}
            requiredColumns={tableSettings.requiredColumns}
            onToggle={tableSettings.toggleColumnVisibility}
            onShowAll={tableSettings.showAllColumns}
          />
          <Button variant="ghost" size="sm" onClick={tableSettings.resetSettings} title="컬럼 설정 초기화">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shrink-0">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="제목 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          {/* 카테고리 필터 */}
          <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 공개 상태 필터 */}
          <Select value={publishedFilter || 'all'} onValueChange={(v) => setPublishedFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full lg:w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="true">공개</SelectItem>
              <SelectItem value="false">비공개</SelectItem>
            </SelectContent>
          </Select>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              검색
            </Button>
          </div>
        </div>
      </div>

      {/* 테이블 — 스크롤 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto scrollbar-hide bg-white rounded-xl border border-gray-200"
      >
        <NoticeTable
          notices={notices}
          isLoading={isLoading}
          onDelete={deleteNotice}
          onTogglePublish={handleTogglePublish}
          onTogglePin={handleTogglePin}
          onEdit={handleEdit}
          tableSettings={tableSettings}
          sort={sort}
          onSort={handleSort}
        />
      </div>

      {/* 플로팅 가로 스크롤바 + 페이지네이션 */}
      <FloatingScrollbar scrollRef={floatingScrollRef} width={tableScrollWidth} />
      <CompactPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* 카테고리 관리 모달 */}
      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        isLoading={categoriesLoading}
        onAdd={(name) => createCategory({ name })}
        onUpdate={(id, name) => updateCategory(id, { name })}
        onDelete={deleteCategory}
      />

      {/* 수정 모달 — NoticeForm을 Dialog 안에 렌더링 */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open)
        if (!open) setEditTarget(null)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>공지사항 수정</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <NoticeForm
              key={editTarget.id}
              notice={editTarget}
              onSubmit={async (data) => {
                setIsSubmitting(true)
                const result = await updateNotice(editTarget.id, data)
                setIsSubmitting(false)
                return result
              }}
              isSubmitting={isSubmitting}
              onSuccess={() => {
                setEditOpen(false)
                setEditTarget(null)
                fetchNotices()
              }}
              onCancel={() => {
                setEditOpen(false)
                setEditTarget(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
