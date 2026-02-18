/**
 * 마스터 테이블 기반 멀티셀렉트 인라인 편집 셀
 * BrandMultiSelectCell을 일반화하여 brands, platforms, items 등 모든 마스터 테이블 지원
 * 클릭 → Popover 열림 → 체크박스 다중 선택 → 닫기 시 저장
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Plus, Loader2, X, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase/client'

interface MasterOption {
  id: string
  name: string
  sort_order: number
}

interface MasterMultiSelectCellProps {
  value: string[]
  onSave: (values: string[]) => Promise<void>
  tableName: string // 'brands' | 'platforms' | 'items' 등
  placeholder?: string
  addPlaceholder?: string // 새 항목 추가 입력 placeholder
  className?: string
}

// 테이블별 옵션 캐시 (컴포넌트 간 공유)
const optionsCache: Record<string, { data: MasterOption[]; time: number }> = {}
const CACHE_TTL = 60_000 // 1분

/**
 * 외부에서 특정 테이블의 캐시를 무효화할 때 사용
 * 예: ImporterFormDialog에서 옵션 이름을 수정한 후, 테이블 셀의 캐시도 갱신
 */
export function invalidateMasterOptionsCache(tableName: string) {
  delete optionsCache[tableName]
}

export default function MasterMultiSelectCell({
  value,
  onSave,
  tableName,
  placeholder = '-',
  addPlaceholder = '새 항목...',
  className,
}: MasterMultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<MasterOption[]>(optionsCache[tableName]?.data || [])
  const [selected, setSelected] = useState<string[]>(value || [])
  const [newItemName, setNewItemName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // Popover 열릴 때의 초기 선택값 (변경 감지용)
  const initialSelectedRef = useRef<string[]>([])

  // 옵션 목록 로드
  const fetchOptions = useCallback(async () => {
    const cached = optionsCache[tableName]
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      setOptions(cached.data)
      return
    }

    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.error(`[MasterMultiSelectCell] ${tableName} 로드 실패:`, error)
        return
      }

      const list = (data || []) as MasterOption[]
      optionsCache[tableName] = { data: list, time: Date.now() }
      setOptions(list)
    } catch (err) {
      console.error(`[MasterMultiSelectCell] 오류:`, err)
    }
  }, [tableName])

  // Popover 열릴 때 옵션 목록 로드 + 선택값 동기화
  useEffect(() => {
    if (isOpen) {
      fetchOptions()
      setSelected(value || [])
      initialSelectedRef.current = [...(value || [])]
    }
  }, [isOpen, fetchOptions, value])

  // 체크박스 토글
  const toggleOption = useCallback((name: string) => {
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(v => v !== name)
        : [...prev, name]
    )
  }, [])

  // 새 항목 추가
  const handleAddOption = useCallback(async () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return

    // 이미 존재하는 항목이면 선택만 추가
    if (options.some(o => o.name === trimmed)) {
      if (!selected.includes(trimmed)) {
        setSelected(prev => [...prev, trimmed])
      }
      setNewItemName('')
      return
    }

    setIsAdding(true)
    try {
      const supabase = getSupabase()
      const maxOrder = options.length > 0
        ? Math.max(...options.map(o => o.sort_order))
        : 0

      const { data, error } = await supabase
        .from(tableName)
        .insert({ name: trimmed, sort_order: maxOrder + 1 })
        .select()
        .single()

      if (error) {
        console.error(`[MasterMultiSelectCell] ${tableName} 추가 실패:`, error)
        return
      }

      const newOption = data as MasterOption
      const updated = [...options, newOption]
      optionsCache[tableName] = { data: updated, time: Date.now() }
      setOptions(updated)

      // 새 항목 자동 선택
      setSelected(prev => [...prev, trimmed])
      setNewItemName('')
    } catch (err) {
      console.error(`[MasterMultiSelectCell] 오류:`, err)
    } finally {
      setIsAdding(false)
    }
  }, [newItemName, options, selected, tableName])

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
        console.error(`[MasterMultiSelectCell] ${tableName} 삭제 실패:`, error)
        return
      }

      const updated = options.filter(o => o.id !== optionId)
      optionsCache[tableName] = { data: updated, time: Date.now() }
      setOptions(updated)

      // 선택 목록에서도 제거
      setSelected(prev => prev.filter(v => v !== optionName))
    } catch (err) {
      console.error(`[MasterMultiSelectCell] 오류:`, err)
    } finally {
      setIsDeleting(null)
    }
  }, [options, tableName])

  // 옵션 이름 수정 시작
  const startEdit = useCallback((option: MasterOption, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(option.id)
    setEditingName(option.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }, [])

  // 옵션 이름 수정 저장
  const handleRenameOption = useCallback(async () => {
    if (!editingId) return
    const trimmed = editingName.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    // 기존 이름과 같으면 취소
    const original = options.find(o => o.id === editingId)
    if (original?.name === trimmed) {
      setEditingId(null)
      return
    }
    // 중복 체크
    if (options.find(o => o.name === trimmed && o.id !== editingId)) {
      setEditingId(null)
      return
    }
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from(tableName)
        .update({ name: trimmed })
        .eq('id', editingId)

      if (error) {
        console.error(`[MasterMultiSelectCell] ${tableName} 수정 실패:`, error)
        setEditingId(null)
        return
      }

      // 캐시 갱신
      const updated = options.map(o => o.id === editingId ? { ...o, name: trimmed } : o)
      optionsCache[tableName] = { data: updated, time: Date.now() }
      setOptions(updated)

      // 선택된 항목의 이름이 변경되었으면 selected 배열도 업데이트
      if (original && selected.includes(original.name)) {
        setSelected(prev => prev.map(v => v === original.name ? trimmed : v))
      }
    } catch (err) {
      console.error(`[MasterMultiSelectCell] 오류:`, err)
    } finally {
      setEditingId(null)
    }
  }, [editingId, editingName, options, selected, tableName])

  // Popover 닫힐 때 저장
  const handleOpenChange = useCallback(async (open: boolean) => {
    if (!open && isOpen) {
      const initial = initialSelectedRef.current
      const changed =
        selected.length !== initial.length ||
        selected.some(s => !initial.includes(s))

      if (changed) {
        setIsSaving(true)
        setHasError(false)
        try {
          await onSave(selected)
        } catch {
          setHasError(true)
        } finally {
          setIsSaving(false)
        }
      }
    }
    setIsOpen(open)
  }, [isOpen, selected, onSave])

  // 저장 중 표시
  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1', className)} onClick={(e) => e.stopPropagation()}>
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
      </div>
    )
  }

  const displayValues = value || []

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-sm transition-colors',
            'hover:bg-blue-50 hover:text-blue-900 cursor-pointer',
            hasError && 'bg-red-50',
            className
          )}
          title="클릭하여 편집"
        >
          {displayValues.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {displayValues.map(item => (
                <Badge
                  key={item}
                  variant="outline"
                  className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 옵션 목록 */}
        <div className="max-h-48 overflow-y-auto p-1">
          {options.length === 0 ? (
            <p className="text-sm text-gray-500 p-2 text-center">
              항목이 없습니다
            </p>
          ) : (
            options.map(option => {
              const isSelected = selected.includes(option.name)
              return (
                <div
                  key={option.id}
                  className={cn(
                    'flex items-center gap-1 rounded hover:bg-gray-100 transition-colors group',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  {editingId === option.id ? (
                    // 수정 모드: 인라인 Input
                    <div className="flex items-center gap-1 w-full px-1 py-0.5">
                      <Input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-7 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleRenameOption() }
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={handleRenameOption}
                      />
                      <button
                        type="button"
                        className="flex-shrink-0 p-1 rounded hover:bg-green-100 text-green-600"
                        onClick={handleRenameOption}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    // 일반 모드: 체크박스 + 이름 + 수정/삭제 버튼
                    <>
                      <button
                        type="button"
                        onClick={() => toggleOption(option.name)}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left"
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn(isSelected && 'font-medium')}>
                          {option.name}
                        </span>
                      </button>
                      {/* 수정/삭제 버튼 (hover 시 표시) */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                        <button
                          type="button"
                          onClick={(e) => startEdit(option, e)}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-all"
                          title="이름 수정"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOption(e, option.id, option.name)}
                          disabled={isDeleting === option.id}
                          className="flex-shrink-0 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                          title="삭제"
                        >
                          {isDeleting === option.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 새 항목 추가 */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
              placeholder={addPlaceholder}
              className="h-7 text-sm"
              disabled={isAdding}
            />
            <button
              type="button"
              onClick={handleAddOption}
              disabled={isAdding || !newItemName.trim()}
              className={cn(
                'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors',
                newItemName.trim()
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
