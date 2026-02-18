/**
 * 컬럼 표시/숨기기 Popover
 * 테이블 툴바에서 사용. useTableSettings 훅과 연동.
 */
'use client'

import { Columns3, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { ColumnDef } from '@/hooks/useTableSettings'

interface ColumnVisibilityPopoverProps {
  /** 전체 컬럼 목록 (순서 반영) */
  columns: ColumnDef[]
  /** 숨긴 컬럼 Set */
  hiddenColumns: Set<string>
  /** 필수 컬럼 Set (숨기기 불가) */
  requiredColumns: Set<string>
  /** 컬럼 토글 핸들러 */
  onToggle: (columnKey: string) => void
  /** 모든 컬럼 표시 핸들러 */
  onShowAll: () => void
}

export default function ColumnVisibilityPopover({
  columns,
  hiddenColumns,
  requiredColumns,
  onToggle,
  onShowAll,
}: ColumnVisibilityPopoverProps) {
  // sticky 컬럼은 목록에서 제외 (항상 표시)
  const toggleableColumns = columns.filter(col => !col.sticky)
  const hiddenCount = hiddenColumns.size

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-500 hover:text-gray-700 relative"
          title="컬럼 표시/숨기기"
        >
          <Columns3 className="w-4 h-4 mr-1.5" />
          컬럼
          {hiddenCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold leading-none">
              {hiddenCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0" sideOffset={4}>
        {/* 헤더 */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">컬럼 표시 설정</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {toggleableColumns.length}개 중 {toggleableColumns.length - hiddenCount}개 표시
          </p>
        </div>

        {/* 체크박스 리스트 */}
        <div className="max-h-[360px] overflow-y-auto py-1">
          {toggleableColumns.map((col) => {
            const isRequired = requiredColumns.has(col.key)
            const isVisible = !hiddenColumns.has(col.key)

            return (
              <label
                key={col.key}
                className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isRequired ? 'cursor-default' : ''
                }`}
              >
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => onToggle(col.key)}
                  disabled={isRequired}
                  className="data-[state=checked]:bg-[#1a2867] data-[state=checked]:border-[#1a2867]"
                />
                <span className={`text-sm flex-1 ${isVisible ? 'text-gray-700' : 'text-gray-400'}`}>
                  {col.label}
                </span>
                {isRequired && (
                  <Lock className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </label>
            )
          })}
        </div>

        {/* 푸터 */}
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowAll}
            disabled={hiddenCount === 0}
            className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2"
          >
            전체 표시
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
