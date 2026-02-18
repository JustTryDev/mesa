/**
 * 스프레드시트 스타일 인라인 편집 셀
 * 클릭 → 편집 → Enter/blur → 저장 → Escape → 취소
 * type: text, number, select 지원
 * 내부적으로 stopPropagation 처리 → 행 클릭(모달) 전파 차단
 *
 * select 모드: Popover 기반 드롭다운 (네이티브 <select> 대신)
 * - 클릭 → Popover 열림 → 옵션 선택 → 즉시 저장 → Popover 닫힘
 * - 6개 이상 옵션이면 검색 입력 자동 표시
 */
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface SelectOption {
  value: string
  label: string
}

interface InlineEditCellProps {
  value: string | number | null
  onSave: (newValue: string) => Promise<void>
  type?: 'text' | 'number' | 'select'
  options?: SelectOption[]
  placeholder?: string
  displayFormatter?: (v: string | number | null) => React.ReactNode
  className?: string
  inputClassName?: string
  /** 편집 시작 전 호출 — false 반환 시 편집 진입 차단 */
  onBeforeEdit?: () => boolean | Promise<boolean>
  /** 여러 줄 입력 모드 — textarea 사용, Enter=줄바꿈, blur=저장 */
  multiline?: boolean
}

export default function InlineEditCell({
  value,
  onSave,
  type = 'text',
  options,
  placeholder = '-',
  displayFormatter,
  className,
  inputClassName,
  onBeforeEdit,
  multiline,
}: InlineEditCellProps) {
  // ── text/number/multiline 편집 상태 ──
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // ── select 전용 Popover 상태 ──
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectSearch, setSelectSearch] = useState('')

  // 편집 모드 시작 (text/number/multiline 전용)
  const startEdit = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSaving) return

    if (onBeforeEdit) {
      const allowed = await onBeforeEdit()
      if (!allowed) return
    }

    setEditValue(value != null ? String(value) : '')
    setIsEditing(true)
    setHasError(false)
  }, [value, isSaving, onBeforeEdit])

  // 편집 모드 진입 시 포커스 (text/number/multiline)
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) {
        (inputRef.current as HTMLInputElement).select()
      }
    }
  }, [isEditing])

  // 저장 처리 (text/number/multiline)
  const handleSave = useCallback(async () => {
    const newValue = editValue.trim()
    const oldValue = value != null ? String(value) : ''

    if (newValue === oldValue) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setHasError(false)

    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch {
      setHasError(true)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }, [editValue, value, onSave])

  // 취소 처리
  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
    setHasError(false)
  }, [])

  // 키보드 이벤트 (text/number/multiline)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (multiline) return
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel, multiline])

  // select 옵션 선택 시 즉시 저장
  const handleSelectChange = useCallback(async (newValue: string) => {
    setIsPopoverOpen(false)
    setIsSaving(true)
    setHasError(false)

    try {
      await onSave(newValue)
    } catch {
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  // 표시할 값
  const displayValue = displayFormatter
    ? displayFormatter(value)
    : (value != null && String(value) !== '' ? String(value) : null)

  // select 타입: 현재 선택된 옵션의 라벨
  const selectLabel = type === 'select' && options
    ? options.find(o => o.value === String(value ?? ''))?.label
    : null

  // ── 저장 중 표시 (공통) ──
  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1 px-1', className)} onClick={(e) => e.stopPropagation()}>
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
      </div>
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // select 타입: Popover 기반 드롭다운
  // 비유: 편의점 자판기 — 버튼을 누르면 메뉴판이 펼쳐지고, 음료를 고르면 바로 나옴
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (type === 'select' && options) {
    // 옵션 6개 이상이면 검색 가능
    const showSearch = options.length >= 6
    const filteredOptions = selectSearch
      ? options.filter(o => o.label.toLowerCase().includes(selectSearch.toLowerCase()))
      : options
    const currentValue = String(value ?? '')

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          setIsPopoverOpen(open)
          if (!open) setSelectSearch('')
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-sm transition-colors',
              'hover:bg-blue-50 hover:text-blue-900 cursor-pointer',
              hasError && 'bg-red-50',
              !displayValue && !selectLabel && 'text-gray-400',
              className
            )}
            title="클릭하여 선택"
          >
            {/* displayFormatter가 있으면 커스텀 표시, 없으면 라벨 또는 placeholder */}
            {displayValue || selectLabel || placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-0"
          align="start"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 검색 입력 (6개 이상 옵션일 때) */}
          {showSearch && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={selectSearch}
                onChange={(e) => setSelectSearch(e.target.value)}
                placeholder="검색..."
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {/* 옵션 리스트 */}
          <div className="max-h-48 overflow-y-auto p-1">
            {/* "선택 안함" 옵션 (빈 값) */}
            <button
              type="button"
              onClick={() => handleSelectChange('')}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-gray-100 transition-colors',
                currentValue === '' && 'bg-blue-50'
              )}
            >
              <span className="text-gray-400">선택 안함</span>
              {currentValue === '' && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
            </button>
            {/* 실제 옵션들 */}
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === currentValue
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectChange(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-gray-100 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  <span className={cn('truncate', isSelected && 'font-medium')}>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-blue-600 flex-shrink-0" />}
                </button>
              )
            })}
            {/* 검색 결과 없음 */}
            {showSearch && selectSearch && filteredOptions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">결과 없음</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // text/number/multiline: 기존 isEditing 기반 편집
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (isEditing) {
    // multiline → textarea
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          rows={3}
          className={cn(
            'w-full rounded border border-blue-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-400 resize-y',
            inputClassName
          )}
          placeholder={placeholder}
        />
      )
    }

    // text/number → input
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full rounded border border-blue-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-400',
          inputClassName
        )}
        placeholder={placeholder}
      />
    )
  }

  // ── 표시 모드 (클릭 시 편집) ──
  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-sm transition-colors',
        'hover:bg-blue-50 hover:text-blue-900 cursor-text',
        multiline && 'whitespace-pre-wrap break-words',
        hasError && 'bg-red-50',
        !displayValue && 'text-gray-400',
        className
      )}
      title="클릭하여 편집"
    >
      {displayValue || placeholder}
    </button>
  )
}
