/**
 * PopoverSelect — shadcn Select를 대체하는 Popover 기반 드롭다운
 *
 * 왜 이걸 만들었나?
 * shadcn Select는 내부적으로 Radix Select를 사용하는데, OS 기본 드롭다운처럼 보임.
 * 이 컴포넌트는 Popover + 커스텀 리스트로 구현해서:
 * - 검색 기능 지원 (옵션이 많을 때)
 * - 선택된 항목에 체크 아이콘 표시
 * - 디자인 일관성 확보 (다른 Popover 기반 UI와 통일)
 *
 * 일상 비유: 자판기(Select) vs 터치 키오스크(PopoverSelect)
 * 자판기는 버튼만 누르면 끝이지만, 키오스크는 검색도 되고 미리보기도 됨
 */
'use client'

import { useState, useRef, useEffect, ReactNode, useMemo } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 드롭다운 옵션 하나의 구조
export interface PopoverSelectOption {
  value: string
  label: string
  icon?: ReactNode   // 옵션 앞에 아이콘 표시 (선택사항)
}

interface PopoverSelectProps {
  /** 현재 선택된 값 (null = 미선택) */
  value: string | null
  /** 값 변경 시 호출되는 콜백 */
  onChange: (value: string | null) => void
  /** 선택 가능한 옵션 목록 */
  options: PopoverSelectOption[]
  /** 미선택 시 표시할 텍스트 */
  placeholder?: string
  /** null 옵션의 라벨 (예: "없음"). 미지정 시 null 선택 불가 */
  emptyLabel?: string
  /** 검색 기능 활성화. 미지정 시 옵션 6개 이상이면 자동 활성화 */
  searchable?: boolean
  /** 비활성화 */
  disabled?: boolean
  /** 트리거 버튼 추가 className */
  className?: string
  /** Label htmlFor 연결용 id */
  id?: string
  /** Popover 정렬 방향 */
  align?: 'start' | 'center' | 'end'
}

export default function PopoverSelect({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  emptyLabel,
  searchable,
  disabled,
  className,
  id,
  align = 'start',
}: PopoverSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 옵션 6개 이상이면 자동으로 검색 활성화
  const showSearch = searchable ?? options.length >= 6

  // 현재 선택된 옵션의 라벨 찾기
  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption?.label ?? placeholder

  // 검색어로 필터링된 옵션 목록
  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const keyword = search.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(keyword))
  }, [options, search])

  // Popover 열릴 때 검색 입력에 포커스
  useEffect(() => {
    if (open && showSearch) {
      // requestAnimationFrame: Popover가 DOM에 마운트된 후 포커스하기 위해
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
    if (!open) {
      setSearch('')  // 닫힐 때 검색어 초기화
    }
  }, [open, showSearch])

  // 옵션 선택 핸들러
  const handleSelect = (newValue: string | null) => {
    onChange(newValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        {/*
          트리거 버튼 — shadcn SelectTrigger와 유사한 스타일
          id를 부여해서 <Label htmlFor="..."> 클릭 시 이 버튼이 포커스됨
        */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            // shadcn SelectTrigger와 유사한 기본 스타일
            'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
            'transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // 값이 없을 때 placeholder 색상
            !selectedOption && 'text-muted-foreground',
            className
          )}
        >
          {/* 선택된 값 또는 placeholder 표시 */}
          <span className="truncate flex items-center gap-2">
            {selectedOption?.icon}
            {displayLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align={align}
      >
        {/* 검색 입력 (옵션이 많을 때만 표시) */}
        {showSearch && (
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색..."
                className="w-full pl-7 pr-2 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
              />
            </div>
          </div>
        )}

        {/* 옵션 리스트 */}
        <div className="max-h-60 overflow-y-auto p-1">
          {/* "없음" 옵션 (emptyLabel이 지정된 경우만) */}
          {emptyLabel && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-gray-100 transition-colors',
                value === null && 'bg-blue-50'
              )}
            >
              <span className="text-gray-400">{emptyLabel}</span>
              {value === null && (
                <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />
              )}
            </button>
          )}

          {/* 일반 옵션 목록 */}
          {filtered.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-gray-100 transition-colors',
                  isSelected && 'bg-blue-50'
                )}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className={cn('truncate', isSelected && 'font-medium')}>
                  {opt.label}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-blue-600" />
                )}
              </button>
            )
          })}

          {/* 검색 결과 없음 */}
          {showSearch && search && filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">
              결과 없음
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
