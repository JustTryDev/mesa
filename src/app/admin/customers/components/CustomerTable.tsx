/**
 * 고객 테이블 컴포넌트
 *
 * 비유: 엑셀 시트 그 자체
 * - 헤더(열 이름)를 클릭하면 정렬됨 (오름차순/내림차순)
 * - 헤더를 드래그하면 열 순서를 바꿀 수 있음
 * - 각 셀을 클릭하면 바로 편집 가능 (인라인 편집)
 * - 행의 빈 곳을 클릭하면 전체 수정 모달이 열림
 *
 * 왜 분리했나?
 * 테이블 렌더링 로직만 300줄이 넘는데, 이게 page.tsx에 있으면
 * 데이터 로직과 UI가 뒤엉켜서 수정이 어려움.
 * 분리하면 "테이블 디자인 변경 = 이 파일만 수정"이 됨
 */
'use client'

import { type ReactNode, type RefObject } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShieldCheck,
  GripVertical,
  Trash2,
  Eye,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateDot, formatPrice } from '@/lib/format'
import { getSupabase } from '@/lib/supabase/client'
import InlineEditCell from '@/components/ui/InlineEditCell'
import ContactInlineEditCell from '@/components/ui/ContactInlineEditCell'
import SelectableOptionCell from '@/components/ui/SelectableOptionCell'
import EntityMultiSelectCell, { type EntityType, type EntitySelection } from '@/components/ui/EntityMultiSelectCell'
import ProjectLinkCell from './ProjectLinkCell'
import { CATEGORY_OPTIONS } from '../constants'
import type { CustomerRow, SortField } from '../types'
import type { SortConfig } from '@/types/common'
import type { useTableSettings } from '@/hooks/useTableSettings'

// useTableSettings의 반환값 타입
type TableSettings = ReturnType<typeof useTableSettings>

interface CustomerTableProps {
  /** 고객 데이터 목록 */
  customers: CustomerRow[]
  /** 고객 데이터 setter (인라인 편집 시 로컬 상태 업데이트) */
  setCustomers: React.Dispatch<React.SetStateAction<CustomerRow[]>>
  /** 테이블 설정 (컬럼 너비/순서/드래그/리사이즈) */
  tableSettings: TableSettings
  /** 정렬 상태 */
  sort: SortConfig
  /** 정렬 변경 핸들러 */
  onSort: (field: SortField) => void
  /** 자가 가입 고객 ID 목록 (인증 뱃지 표시용) */
  selfRegisteredIds: Set<string>
  /** 스크롤 컨테이너 ref (플로팅 스크롤바 연동) */
  scrollContainerRef: RefObject<HTMLDivElement | null>

  // 인라인 편집 핸들러
  onInlineSave: (customerId: string, field: string, value: string) => Promise<void>
  onInlineNumberSave: (customerId: string, field: string, value: string) => Promise<void>
  onBeforeEmailEdit: (customerId: string) => Promise<boolean>
  onInlineEmailSave: (customerId: string, value: string) => Promise<void>
  onInlineCompanyChange: (customerId: string, newCompanyId: string) => Promise<void>
  onEntitiesSave: (customerId: string, entities: EntitySelection[]) => Promise<void>
  onCreateEntity: (type: EntityType) => void
  onEditEntity: (type: EntityType, id: string) => Promise<void>

  // 행/셀 상호작용
  onRowClick: (customer: CustomerRow) => void
  onOpenFullEdit: (customer: CustomerRow, tab?: 'info' | 'files') => void
  onDelete: (customer: CustomerRow) => void
}

export default function CustomerTable({
  customers,
  setCustomers,
  tableSettings,
  sort,
  onSort,
  selfRegisteredIds,
  scrollContainerRef,
  onInlineSave,
  onInlineNumberSave,
  onBeforeEmailEdit,
  onInlineEmailSave,
  onInlineCompanyChange,
  onEntitiesSave,
  onCreateEntity,
  onEditEntity,
  onRowClick,
  onOpenFullEdit,
  onDelete,
}: CustomerTableProps) {
  // 정렬 아이콘 렌더링
  const renderSortIcon = (field?: SortField) => {
    if (!field) return null
    if (sort.field !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />
  }

  // 인라인 셀 클릭 시 행 클릭 전파 차단
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-auto scrollbar-hide bg-white rounded-xl border border-gray-200"
    >
      <table className="w-full table-fixed" style={{ minWidth: tableSettings.totalWidth }}>
        {/* 테이블 헤더 */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            {tableSettings.visibleColumns.map((col) => (
              <th
                key={col.key}
                style={{ width: tableSettings.columnWidths[col.key], minWidth: 60 }}
                className={`
                  px-4 py-3 whitespace-nowrap select-none relative group
                  text-center
                  ${col.sticky ? 'sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]' : ''}
                  ${col.sortField ? 'cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors' : ''}
                  ${tableSettings.dragOverColumn === col.key ? 'bg-blue-50 border-l-2 border-blue-400' : ''}
                  ${tableSettings.draggedColumn === col.key ? 'opacity-50' : ''}
                `}
                draggable={!col.sticky}
                onDragStart={() => tableSettings.handleDragStart(col.key)}
                onDragOver={(e) => tableSettings.handleDragOver(e, col.key)}
                onDrop={() => tableSettings.handleDrop(col.key)}
                onDragEnd={tableSettings.handleDragEnd}
                onClick={col.sortField ? () => onSort(col.sortField as SortField) : undefined}
                title={col.sortField ? `${col.label} 정렬` : undefined}
              >
                <span className="inline-flex items-center">
                  {!col.sticky && (
                    <GripVertical className="w-3 h-3 mr-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
                  )}
                  {col.label}
                  {renderSortIcon(col.sortField as SortField | undefined)}
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

        {/* 테이블 바디 */}
        <tbody className="divide-y divide-gray-100">
          {customers.map((cust) => {
            // 컬럼 키별 셀 렌더러
            // 비유: 엑셀 한 행의 각 셀에 어떤 내용을 넣을지 결정하는 "레시피"
            const cellRenderers: Record<string, ReactNode> = {
              customer_code: (
                <td key="customer_code" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['customer_code'] }}>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {cust.customer_code}
                  </span>
                </td>
              ),
              category: (
                <td key="category" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['category'] }}>
                  <InlineEditCell
                    value={cust.category}
                    type="select"
                    options={CATEGORY_OPTIONS}
                    onSave={(v) => onInlineSave(cust.id, 'category', v)}
                    placeholder="-"
                  />
                </td>
              ),
              name: (
                <td key="name" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['name'] }}>
                  <InlineEditCell
                    value={cust.name}
                    onSave={(v) => onInlineSave(cust.id, 'name', v)}
                    placeholder="-"
                    className="font-medium text-gray-900"
                  />
                </td>
              ),
              email: (
                <td key="email" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['email'] }}>
                  <InlineEditCell
                    value={cust.email}
                    onSave={(v) => onInlineEmailSave(cust.id, v)}
                    placeholder="-"
                    className="text-gray-600"
                    onBeforeEdit={() => onBeforeEmailEdit(cust.id)}
                    displayFormatter={(v) => {
                      if (!v) return null
                      const isSelfReg = selfRegisteredIds.has(cust.id)
                      return (
                        <span className="flex items-center gap-1">
                          <span className="truncate">{String(v)}</span>
                          {isSelfReg && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex-shrink-0" title="고객이 직접 가입한 인증 이메일">
                              <ShieldCheck className="w-3 h-3" />
                              인증
                            </span>
                          )}
                        </span>
                      )
                    }}
                  />
                </td>
              ),
              phones: (
                <td key="phones" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['phones'] }}>
                  <ContactInlineEditCell
                    entries={(Array.isArray(cust.phones) ? cust.phones : []).map(p => ({ label: p.label, value: p.number }))}
                    onSave={async (entries) => {
                      const phonesData = entries.map(e => ({ label: e.label, number: e.value }))
                      const supabase = getSupabase()
                      const { error } = await supabase
                        .from('customers')
                        .update({
                          phones: phonesData.length > 0 ? phonesData : null,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', cust.id)
                      if (error) throw error
                      setCustomers(prev => prev.map(c =>
                        c.id === cust.id
                          ? { ...c, phones: phonesData.length > 0 ? phonesData : null, updated_at: new Date().toISOString() }
                          : c
                      ))
                    }}
                    labelTableName="phone_labels"
                    inputPlaceholder="010-0000-0000"
                    typeLabel="연락처"
                  />
                </td>
              ),
              company: (
                <td key="company" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['company'] }} onClick={stopPropagation}>
                  <EntityMultiSelectCell
                    mode="single"
                    entityTypes={['company']}
                    value={cust.company_id ? [{ type: 'company', id: cust.company_id }] : []}
                    displayEntities={cust.companies ? [{
                      type: 'company', id: cust.company_id!, name: cust.companies.name, code: cust.companies.company_code,
                    }] : []}
                    onSave={async (entities) => {
                      const newCompanyId = entities[0]?.id || ''
                      await onInlineCompanyChange(cust.id, newCompanyId)
                    }}
                    onCreateEntity={onCreateEntity}
                    onEditEntity={onEditEntity}
                    allowNone
                    noneLabel="개인 고객 (선택 안함)"
                    placeholder="-"
                  />
                </td>
              ),
              related_entities: (
                <td key="related_entities" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['related_entities'] }} onClick={stopPropagation}>
                  <EntityMultiSelectCell
                    value={cust.entities?.map(e => ({ type: e.type, id: e.id })) || []}
                    displayEntities={cust.entities}
                    onSave={(entities) => onEntitiesSave(cust.id, entities)}
                    excludeEntityIds={cust.company_id ? [{ type: 'company', id: cust.company_id }] : undefined}
                    onCreateEntity={onCreateEntity}
                    onEditEntity={onEditEntity}
                  />
                </td>
              ),
              department: (
                <td key="department" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['department'] }}>
                  <SelectableOptionCell
                    value={cust.department}
                    onSave={(v) => onInlineSave(cust.id, 'department', v)}
                    tableName="customer_departments"
                    placeholder="-"
                    className="text-sm text-gray-600"
                  />
                </td>
              ),
              position: (
                <td key="position" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['position'] }}>
                  <SelectableOptionCell
                    value={cust.position}
                    onSave={(v) => onInlineSave(cust.id, 'position', v)}
                    tableName="customer_positions"
                    placeholder="-"
                    className="text-sm text-gray-600"
                  />
                </td>
              ),
              fax: (
                <td key="fax" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['fax'] }}>
                  <InlineEditCell
                    value={cust.fax}
                    onSave={(v) => onInlineSave(cust.id, 'fax', v)}
                    placeholder="-"
                    className="text-gray-600"
                  />
                </td>
              ),
              homepage: (
                <td key="homepage" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['homepage'] }}>
                  <InlineEditCell
                    value={cust.homepage}
                    onSave={(v) => onInlineSave(cust.id, 'homepage', v)}
                    placeholder="-"
                    className="text-gray-600 truncate"
                  />
                </td>
              ),
              project_link: (
                <td key="project_link" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['project_link'] }}>
                  <ProjectLinkCell
                    customerId={cust.id}
                    customerCode={cust.customer_code}
                    projectLink={cust.project_link}
                    onLinkUpdate={(newLink) => {
                      setCustomers(prev => prev.map(c =>
                        c.id === cust.id
                          ? { ...c, project_link: newLink, updated_at: new Date().toISOString() }
                          : c
                      ))
                    }}
                  />
                </td>
              ),
              cash_receipt_number: (
                <td key="cash_receipt_number" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['cash_receipt_number'] }}>
                  <InlineEditCell
                    value={cust.cash_receipt_number}
                    onSave={(v) => onInlineSave(cust.id, 'cash_receipt_number', v)}
                    placeholder="-"
                    className="text-gray-600"
                  />
                </td>
              ),
              prepaid_balance: (
                <td key="prepaid_balance" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['prepaid_balance'] }}>
                  <InlineEditCell
                    value={cust.prepaid_balance}
                    type="number"
                    onSave={(v) => onInlineNumberSave(cust.id, 'prepaid_balance', v)}
                    placeholder="0"
                    displayFormatter={(v) => (
                      <span className="font-medium text-gray-900">{formatPrice(Number(v) || 0)}</span>
                    )}
                  />
                </td>
              ),
              points: (
                <td key="points" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['points'] }}>
                  <InlineEditCell
                    value={cust.points}
                    type="number"
                    onSave={(v) => onInlineNumberSave(cust.id, 'points', v)}
                    placeholder="0"
                    displayFormatter={(v) => (
                      <span className="font-medium text-gray-900">{(Number(v) || 0).toLocaleString()}P</span>
                    )}
                  />
                </td>
              ),
              contract_documents: (() => {
                // customer_files 테이블 기반 실제 파일 개수 (폴더 제외)
                const fileCount = cust._fileCount ?? 0
                const hasFiles = fileCount > 0
                return (
                  <td key="contract_documents" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['contract_documents'] }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenFullEdit(cust, 'files') }}
                      className={`inline-flex items-center gap-1 text-xs ${
                        hasFiles
                          ? 'text-amber-600 hover:text-amber-800 font-medium'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={hasFiles ? `파일 ${fileCount}개` : '파일 관리'}
                    >
                      {hasFiles ? (
                        <>
                          <FolderOpen className="w-3.5 h-3.5" />
                          {fileCount}
                        </>
                      ) : (
                        <>
                          <Folder className="w-3.5 h-3.5" />
                          파일
                        </>
                      )}
                    </button>
                  </td>
                )
              })(),
              updated_at: (
                <td key="updated_at" className="px-4 py-2 overflow-hidden" style={{ width: tableSettings.columnWidths['updated_at'] }}>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {cust.updated_at ? formatDateDot(new Date(cust.updated_at)) : '-'}
                  </span>
                </td>
              ),
              actions: (
                <td key="actions" className="px-4 py-2 sticky right-0 bg-white shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]" style={{ width: tableSettings.columnWidths['actions'] }} onClick={stopPropagation}>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => onOpenFullEdit(cust)}
                      title="상세 보기">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(cust)}
                      title="삭제">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              ),
            }
            return (
              <tr
                key={cust.id}
                className="hover:bg-gray-50/50 cursor-pointer"
                onClick={() => onRowClick(cust)}
              >
                {tableSettings.visibleColumns.map(col => cellRenderers[col.key])}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
