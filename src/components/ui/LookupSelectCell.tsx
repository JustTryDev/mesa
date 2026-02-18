/**
 * 룩업 테이블 기반 인라인 선택기 (Popover + Command)
 *
 * 출고 방식, 주문 유형, 통관 방식 등 name+sort_order 구조의
 * 룩업 테이블에서 옵션을 선택하고, 인라인에서 추가/수정/삭제합니다.
 *
 * @example
 * <LookupSelectCell
 *   value={order.shippingMethod}
 *   tableName="shipping_methods"
 *   onSave={(v) => handleSave('shipping_method', v)}
 *   placeholder="선택"
 * />
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getSupabase } from '@/lib/supabase/client'
import { invalidateLookupCache } from '@/hooks/useLookupOptions'

// ── 타입 ──

interface LookupItem {
  id: string
  name: string
  sort_order: number
}

interface LookupSelectCellProps {
  /** 현재 선택된 값 (name 텍스트) */
  value: string | null
  /** 룩업 테이블명 (shipping_methods 등) */
  tableName: string
  /** 값 저장 콜백 */
  onSave: (value: string | null) => Promise<void>
  placeholder?: string
  className?: string
}

// ── 컴포넌트 ──

export default function LookupSelectCell({
  value,
  tableName,
  onSave,
  placeholder = '-',
  className,
}: LookupSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)
  const queryClient = useQueryClient()

  // 추가 입력
  const [newName, setNewName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  // 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // 삭제 확인
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── 데이터 조회 (useQuery, Popover 열릴 때만 실행) ──

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['lookupSelectCell-items', tableName],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from(tableName)
        .select('id, name, sort_order')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data || []) as LookupItem[]
    },
    enabled: isOpen,
  })

  // Popover 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setNewName('')
      setEditingId(null)
      setDeletingId(null)
    }
  }, [isOpen])

  // 수정 모드 진입 시 포커스
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // ── 선택 ──

  const handleSelect = useCallback(async (name: string | null) => {
    // 같은 값 다시 선택 → 해제
    const newValue = name === value ? null : name
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
  }, [value, onSave])

  // ── 추가 ──

  const handleAdd = useCallback(async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    // 중복 확인
    if (items.some(i => i.name === trimmed)) {
      setNewName('')
      return
    }

    setIsAdding(true)
    try {
      const supabase = getSupabase()
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0
      const { error } = await supabase
        .from(tableName)
        .insert({ name: trimmed, sort_order: maxOrder + 1 })
      if (error) throw error

      invalidateLookupCache(tableName)
      setNewName('')
      // 캐시 무효화로 목록 새로고침
      await queryClient.invalidateQueries({ queryKey: ['lookupSelectCell-items', tableName] })
    } catch (err) {
      console.error(`옵션 추가 실패:`, err)
    } finally {
      setIsAdding(false)
    }
  }, [newName, items, tableName, queryClient])

  // ── 수정 ──

  const startEdit = useCallback((item: LookupItem, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setEditingId(item.id)
    setEditName(item.name)
  }, [])

  const handleEditSave = useCallback(async () => {
    if (!editingId) return
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }

    // 변경 없으면 닫기
    const original = items.find(i => i.id === editingId)
    if (original?.name === trimmed) {
      setEditingId(null)
      return
    }

    // 중복 확인
    if (items.some(i => i.name === trimmed && i.id !== editingId)) {
      setEditingId(null)
      return
    }

    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from(tableName)
        .update({ name: trimmed })
        .eq('id', editingId)
      if (error) throw error

      invalidateLookupCache(tableName)
      setEditingId(null)
      // 캐시 무효화로 목록 새로고침
      await queryClient.invalidateQueries({ queryKey: ['lookupSelectCell-items', tableName] })
    } catch (err) {
      console.error(`옵션 수정 실패:`, err)
      setEditingId(null)
    }
  }, [editingId, editName, items, tableName, queryClient])

  // ── 삭제 ──

  const handleDelete = useCallback(async (id: string) => {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      if (error) throw error

      invalidateLookupCache(tableName)
      setDeletingId(null)
      // 캐시 무효화로 목록 새로고침
      await queryClient.invalidateQueries({ queryKey: ['lookupSelectCell-items', tableName] })
    } catch (err) {
      console.error(`옵션 삭제 실패:`, err)
      setDeletingId(null)
    }
  }, [tableName, queryClient])

  // ── 저장 중 표시 ──

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1', className)} onClick={(e) => e.stopPropagation()}>
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
      </div>
    )
  }

  // ── 렌더링 ──

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full text-left px-1.5 py-0.5 -mx-1.5 rounded text-xs transition-colors overflow-hidden',
            'hover:bg-blue-50 hover:text-blue-900 cursor-pointer',
            hasError && 'bg-red-50',
            !value && 'text-gray-400',
            className
          )}
          title="클릭하여 편집"
        >
          <span className="truncate">{value || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="검색..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? '로딩 중...' : '검색 결과가 없습니다.'}
            </CommandEmpty>
            <CommandGroup>
              {/* 선택 해제 옵션 */}
              <CommandItem
                value="__none__"
                keywords={[]}
                onSelect={() => handleSelect(null)}
              >
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                <span className="text-gray-500">선택 안함</span>
              </CommandItem>

              {/* 항목 목록 */}
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    // 수정/삭제 모드일 때는 선택하지 않음
                    if (editingId || deletingId) return
                    handleSelect(item.name)
                  }}
                  className="group"
                >
                  {/* 수정 모드 */}
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleEditSave() }
                          if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
                        }}
                        onBlur={handleEditSave}
                        className="flex-1 px-1.5 py-0.5 text-sm border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  ) : deletingId === item.id ? (
                    /* 삭제 확인 모드 */
                    <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-red-600 text-xs flex-1">삭제할까요?</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeletingId(null) }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    /* 일반 표시 모드 */
                    <>
                      <Check className={cn('mr-2 h-4 w-4', value === item.name ? 'opacity-100' : 'opacity-0')} />
                      <span className="flex-1">{item.name}</span>
                      {/* 수정/삭제 버튼 (hover 시 표시) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startEdit(item, e)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeletingId(item.id) }}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {/* 새 옵션 추가 입력 (고정 영역) */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            <input
              ref={addInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
              }}
              placeholder="새 옵션 추가..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
              disabled={isAdding}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || isAdding}
              className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
