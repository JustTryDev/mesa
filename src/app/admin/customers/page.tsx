/**
 * 고객 관리 페이지
 *
 * 비유: 레스토랑의 "홀 매니저"
 * - 주방(useCustomers 훅)에서 데이터를 가져오고
 * - 각 섹션(필터, 테이블, 다이얼로그)에 일을 분배
 * - 직접 요리하지 않고 "누가 뭘 할지"만 관리
 *
 * 이 파일은 순수하게 "조합(composition)"만 담당합니다.
 * 데이터 로직은 hooks/useCustomers.ts에,
 * UI 조각들은 components/ 폴더에 각각 분리되어 있습니다.
 */
'use client'

import {
  UserCheck,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import TableSkeleton from '@/components/admin/TableSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useTableSettings } from '@/hooks/useTableSettings'
import ColumnVisibilityPopover from '@/components/ui/ColumnVisibilityPopover'
import { useFloatingScrollbar } from '@/hooks/useFloatingScrollbar'
import { FloatingScrollbar } from '@/components/ui/FloatingScrollbar'
import CompactPagination from '@/components/ui/CompactPagination'

// 페이지 전용 모듈
import { COLUMNS, DEFAULT_WIDTHS } from './constants'
import type { SortField, CustomerRow } from './types'
import { useCustomers } from './hooks/useCustomers'
import CustomerFilters from './components/CustomerFilters'
import CustomerTable from './components/CustomerTable'
import CustomerDialogs from './components/CustomerDialogs'

export default function CustomersPage() {
  const { user } = useAuth()

  // 테이블 설정 (컬럼 너비/순서, 사용자별 저장)
  const tableSettings = useTableSettings({
    pageId: 'customers',
    columns: COLUMNS,
    defaultWidths: DEFAULT_WIDTHS,
    userId: user?.id,
    requiredColumns: ['customer_code', 'name', 'actions'],
  })

  // 고객 데이터 + 비즈니스 로직 (커스텀 훅)
  const data = useCustomers()

  // 플로팅 스크롤바 (테이블 가로 스크롤 연동)
  const { scrollContainerRef, floatingScrollRef, tableScrollWidth } = useFloatingScrollbar(data.isLoading)

  // 칼럼 헤더 정렬 클릭 핸들러
  const handleSort = (field: SortField) => {
    data.setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    data.setPage(1) // 정렬 변경 시 첫 페이지로
  }

  // 전체 수정 모달 열기 (서류 편집 등)
  const openFullEdit = (customer: CustomerRow, tab: 'info' | 'files' = 'info') => {
    data.setEditTarget(customer)
    data.setEditInitialTab(tab)
    data.setEditDialogOpen(true)
  }

  // 행 클릭 -> 수정 모달 (인라인 편집 셀 외 영역)
  const handleRowClick = (customer: CustomerRow) => {
    openFullEdit(customer)
  }

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">고객 관리</h1>
            <p className="text-sm text-gray-500">총 {data.total}명 · 셀 클릭 = 인라인 편집 · 행 클릭 = 전체 수정</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => data.setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            고객 등록
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={data.fetchCustomers}
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <ColumnVisibilityPopover
            columns={tableSettings.orderedColumns}
            hiddenColumns={tableSettings.hiddenColumns}
            requiredColumns={tableSettings.requiredColumns}
            onToggle={tableSettings.toggleColumnVisibility}
            onShowAll={tableSettings.showAllColumns}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={tableSettings.resetSettings}
            title="컬럼 설정 초기화 (너비/순서/숨기기)"
            className="text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <CustomerFilters
        searchQuery={data.searchQuery}
        onSearchChange={data.setSearchQuery}
        companyFilter={data.companyFilter}
        onCompanyFilterChange={data.setCompanyFilter}
        categoryFilter={data.categoryFilter}
        onCategoryFilterChange={data.setCategoryFilter}
        companies={data.companies}
      />

      {/* 테이블 */}
      {data.isLoading ? (
        <TableSkeleton />
      ) : data.customers.length === 0 ? (
        <EmptyState entityName="고객" hasSearch={!!data.debouncedSearch || data.companyFilter !== 'all' || data.categoryFilter !== 'all'} />
      ) : (
        <CustomerTable
          customers={data.customers}
          setCustomers={data.setCustomers}
          tableSettings={tableSettings}
          sort={data.sort}
          onSort={handleSort}
          selfRegisteredIds={data.selfRegisteredIds}
          scrollContainerRef={scrollContainerRef}
          onInlineSave={data.handleInlineSave}
          onInlineNumberSave={data.handleInlineNumberSave}
          onBeforeEmailEdit={data.handleBeforeEmailEdit}
          onInlineEmailSave={data.handleInlineEmailSave}
          onInlineCompanyChange={data.handleInlineCompanyChange}
          onEntitiesSave={data.handleEntitiesSave}
          onCreateEntity={data.handleCreateEntity}
          onEditEntity={data.handleEditEntity}
          onRowClick={handleRowClick}
          onOpenFullEdit={openFullEdit}
          onDelete={data.setDeleteTarget}
        />
      )}

      <FloatingScrollbar scrollRef={floatingScrollRef} width={tableScrollWidth} />
      <CompactPagination
        currentPage={data.page}
        totalPages={data.totalPages}
        onPageChange={data.setPage}
      />

      {/* 다이얼로그 모음 */}
      <CustomerDialogs
        createDialogOpen={data.createDialogOpen}
        onCreateDialogChange={data.setCreateDialogOpen}
        onCreateSuccess={data.fetchCustomers}
        editDialogOpen={data.editDialogOpen}
        onEditDialogChange={data.setEditDialogOpen}
        editTarget={data.editTarget}
        onEditSuccess={data.fetchCustomers}
        editInitialTab={data.editInitialTab}
        deleteTarget={data.deleteTarget}
        onDeleteTargetChange={data.setDeleteTarget}
        onDeleteConfirm={data.handleDelete}
        isDeleting={data.isDeleting}
        previewFile={data.previewFile}
        onPreviewFileChange={data.setPreviewFile}
        companyDialogOpen={data.companyDialogOpen}
        onCompanyDialogChange={data.setCompanyDialogOpen}
        companyEditTarget={data.companyEditTarget}
        onEntitySuccess={data.handleEntitySuccess}
        importerDialogOpen={data.importerDialogOpen}
        onImporterDialogChange={data.setImporterDialogOpen}
        importerEditTarget={data.importerEditTarget}
        emailWarningTarget={data.emailWarningTarget}
        emailWarningResolveRef={data.emailWarningResolveRef}
        onEmailWarningClose={() => data.setEmailWarningTarget(null)}
      />
    </div>
  )
}
