/**
 * 단일 선택 + 옵션 추가/수정/삭제 인라인 편집 셀
 * 부서, 직급 등 DB 테이블 기반 옵션에 사용
 * 클릭 → Popover → 옵션 선택 (즉시 저장) / 새 옵션 추가 / 이름 수정 / 삭제
 *
 * filterColumn/filterValue: 부모 카테고리 기반 필터링 지원
 * 예) tableName="resource_sub_categories", filterColumn="category", filterValue="가이드"
 *
 * onOptionRename: 옵션 이름 변경 시 연관 데이터 일괄 업데이트 콜백
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Check, Plus, Loader2, X, Pencil } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase/client'

interface OptionItem {
  id: string
  name: string
  sort_order: number
}

interface SelectableOptionCellProps {
  /** 현재 선택된 값 (텍스트) */
  value: string | null
  /** 저장 콜백 */
  onSave: (value: string) => Promise<void>
  /** 옵션을 불러올 테이블명 (departments, positions 등) */
  tableName: string
  placeholder?: string
  className?: string
  /** 필터 칼럼명 (예: 'category') */
  filterColumn?: string
  /** 필터 값 (예: '가이드') — 이 값이 비어있으면 Popover 비활성 */
  filterValue?: string | null
  /** 필터 미지정 시 표시할 안내 메시지 */
  filterEmptyMessage?: string
  /** 옵션 이름 변경 시 연관 데이터 업데이트 콜백 */
  onOptionRename?: (oldName: string, newName: string) => Promise<void>
}

// 테이블별 옵션 캐시 (필터 조건 포함)
const optionsCache: Record<string, { data: OptionItem[]; time: number }> = {}
const CACHE_TTL = 60_000

/** 캐시 무효화 (외부에서 사용) */
export function invalidateOptionsCache(tableName: string) {
  Object.keys(optionsCache).forEach(key => {
    if (key === tableName || key.startsWith(`${tableName}:`)) {
      delete optionsCache[key]
    }
  })
}

export default function SelectableOptionCell({
  value,
  onSave,
  tableName,
  placeholder = '-',
  className,
  filterColumn,
  filterValue,
  filterEmptyMessage,
  onOptionRename,
}: SelectableOptionCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<OptionItem[]>([])
  const [newOptionName, setNewOptionName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  // 캐시 키 (필터 조건 포함)
  const cacheKey = filterColumn && filterValue
    ? `${tableName}:${filterColumn}=${filterValue}`
    : tableName

  // 옵션 로드
  const fetchOptions = useCallback(async () => {
    // 필터 필요한데 값이 없으면 빈 목록
    if (filterColumn && !filterValue) {
      setOptions([])
      return
    }

    const cached = optionsCache[cacheKey]
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      setOptions(cached.data)
      return
    }

    try {
      const supabase = getSupabase()
      let query = supabase
        .from(tableName)
        .select('*')
        .order('sort_order', { ascending: true })

      // 필터 적용
      if (filterColumn && filterValue) {
        query = query.eq(filterColumn, filterValue)
      }

      const { data, error } = await query

      if (error) {
        console.error(`[SelectableOptionCell] ${tableName} 로드 실패:`, error)
        return
      }

      const list = (data || []) as OptionItem[]
      optionsCache[cacheKey] = { data: list, time: Date.now() }
      setOptions(list)
    } catch (err) {
      console.error(`[SelectableOptionCell] 오류:`, err)
    }
  }, [tableName, cacheKey, filterColumn, filterValue])

  useEffect(() => {
    if (isOpen) fetchOptions()
  }, [isOpen, fetchOptions])

  // 수정 모드 진입 시 input focus
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // 옵션 선택 (즉시 저장 + Popover 닫기)
  const handleSelect = useCallback(async (optionName: string) => {
    if (editingId) return // 수정 중에는 선택 비활성
    // 이미 선택된 값이면 선택 해제
    const newValue = optionName === value ? '' : optionName
    setIsOpen(false)
    setIsSaving(true)
    setHasError(false)
    try {
      await onSave(newValue)
    } catch {
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }, [value, onSave, editingId])

  // 새 옵션 추가
  const handleAddOption = useCallback(async () => {
    const trimmed = newOptionName.trim()
    if (!trimmed) return

    // 이미 존재하면 선택만
    if (options.some(o => o.name === trimmed)) {
      handleSelect(trimmed)
      setNewOptionName('')
      return
    }

    setIsAdding(true)
    try {
      const supabase = getSupabase()
      const maxOrder = options.length > 0
        ? Math.max(...options.map(o => o.sort_order))
        : 0

      // 필터 칼럼 값 포함하여 insert
      const insertPayload: Record<string, unknown> = {
        name: trimmed,
        sort_order: maxOrder + 1,
      }
      if (filterColumn && filterValue) {
        insertPayload[filterColumn] = filterValue
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select()
        .single()

      if (error) {
        console.error(`[SelectableOptionCell] 옵션 추가 실패:`, error)
        return
      }

      const newOption = data as OptionItem
      const updated = [...options, newOption]
      optionsCache[cacheKey] = { data: updated, time: Date.now() }
      setOptions(updated)
      setNewOptionName('')

      // 추가 후 바로 선택
      handleSelect(trimmed)
    } catch (err) {
      console.error(`[SelectableOptionCell] 오류:`, err)
    } finally {
      setIsAdding(false)
    }
  }, [newOptionName, options, tableName, cacheKey, handleSelect, filterColumn, filterValue])

  // 옵션 이름 수정 시작
  const startEditing = useCallback((e: React.MouseEvent, option: OptionItem) => {
    e.stopPropagation()
    setEditingId(option.id)
    setEditingName(option.name)
  }, [])

  // 옵션 이름 수정 저장
  const handleRename = useCallback(async () => {
    if (!editingId) return
    const trimmed = editingName.trim()
    const option = options.find(o => o.id === editingId)
    if (!option || !trimmed || trimmed === option.name) {
      setEditingId(null)
      setEditingName('')
      return
    }

    // 중복 체크
    if (options.some(o => o.id !== editingId && o.name === trimmed)) {
      toast.error('이미 존재하는 이름입니다.')
      return
    }

    setIsRenaming(true)
    try {
      const oldName = option.name
      const supabase = getSupabase()

      // 마스터 테이블 업데이트
      const { error } = await supabase
        .from(tableName)
        .update({ name: trimmed })
        .eq('id', editingId)

      if (error) {
        console.error(`[SelectableOptionCell] 이름 수정 실패:`, error)
        return
      }

      // 캐시 갱신
      const updated = options.map(o =>
        o.id === editingId ? { ...o, name: trimmed } : o
      )
      optionsCache[cacheKey] = { data: updated, time: Date.now() }
      setOptions(updated)

      // 연관 데이터 업데이트 콜백
      if (onOptionRename) {
        await onOptionRename(oldName, trimmed)
      }

      // 현재 선택된 값이 변경된 옵션이면 갱신
      if (value === oldName) {
        await onSave(trimmed)
      }

      setEditingId(null)
      setEditingName('')
    } catch (err) {
      console.error(`[SelectableOptionCell] 오류:`, err)
    } finally {
      setIsRenaming(false)
    }
  }, [editingId, editingName, options, tableName, cacheKey, onOptionRename, value, onSave])

  // 수정 취소
  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingName('')
  }, [])

  // 옵션 삭제
  const handleDeleteOption = useCallback(async (e: React.MouseEvent, optionId: string, optionName: string) => {
    e.stopPropagation()
    setIsDeleting(optionId)
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', optionId)

      if (error) {
        console.error(`[SelectableOptionCell] 옵션 삭제 실패:`, error)
        return
      }

      // 캐시 갱신
      const updated = options.filter(o => o.id !== optionId)
      optionsCache[cacheKey] = { data: updated, time: Date.now() }
      setOptions(updated)

      // 현재 선택된 값이 삭제된 옵션이면 비우기
      if (value === optionName) {
        await onSave('')
      }
    } catch (err) {
      console.error(`[SelectableOptionCell] 오류:`, err)
    } finally {
      setIsDeleting(null)
    }
  }, [tableName, cacheKey, options, value, onSave])

  // 필터 필요한데 값이 없으면 비활성 상태
  const isFilterDisabled = !!filterColumn && !filterValue

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1', className)} onClick={(e) => e.stopPropagation()}>
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
      </div>
    )
  }

  // 필터 미지정 시 Popover 대신 안내 메시지
  if (isFilterDisabled) {
    return (
      <span
        className={cn(
          'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-sm text-gray-300 cursor-not-allowed',
          className
        )}
        title={filterEmptyMessage || '상위 항목을 먼저 선택하세요'}
      >
        {value || placeholder}
      </span>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) cancelEditing()
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-sm transition-colors',
            'hover:bg-blue-50 hover:text-blue-900 cursor-pointer',
            hasError && 'bg-red-50',
            !value && 'text-gray-400',
            className
          )}
          title="클릭하여 편집"
        >
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 옵션 목록 */}
        <div className="max-h-48 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
          {options.length === 0 ? (
            <p className="text-sm text-gray-500 p-2 text-center">
              옵션이 없습니다
            </p>
          ) : (
            options.map(option => {
              const isSelected = value === option.name
              const isEditing = editingId === option.id

              // 수정 모드
              if (isEditing) {
                return (
                  <div key={option.id} className="flex items-center gap-1 p-1">
                    <Input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleRename()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelEditing()
                        }
                      }}
                      className="h-7 text-sm flex-1"
                      disabled={isRenaming}
                    />
                    <button
                      type="button"
                      onClick={handleRename}
                      disabled={isRenaming || !editingName.trim()}
                      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isRenaming ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isRenaming}
                      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              }

              // 일반 모드
              return (
                <div
                  key={option.id}
                  className={cn(
                    'flex items-center gap-0.5 rounded hover:bg-gray-100 transition-colors group',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(option.name)}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left min-w-0"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={cn('truncate', isSelected && 'font-medium')}>
                      {option.name}
                    </span>
                  </button>
                  {/* 수정 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => startEditing(e, option)}
                    className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-all"
                    title="이름 수정"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteOption(e, option.id, option.name)}
                    disabled={isDeleting === option.id}
                    className="flex-shrink-0 p-1 mr-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                    title="삭제"
                  >
                    {isDeleting === option.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* 새 옵션 추가 */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            <Input
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
              placeholder="새 옵션 추가..."
              className="h-7 text-sm"
              disabled={isAdding}
            />
            <button
              type="button"
              onClick={handleAddOption}
              disabled={isAdding || !newOptionName.trim()}
              className={cn(
                'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors',
                newOptionName.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
