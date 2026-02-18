/**
 * 연락처/이메일 인라인 편집 팝오버 셀
 * 목록 테이블에서 다중 연락처/이메일 항목을 직접 추가/수정/삭제
 * 회사, 고객, 수입사 관리 페이지에서 공용 사용
 */
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, X, Copy, Check, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LabelSelectPopover from '@/components/ui/LabelSelectPopover'

/** 연락처/이메일 항목 (범용) */
export interface ContactEntry {
  label: string
  value: string
}

interface ContactInlineEditCellProps {
  /** 현재 항목 배열 */
  entries: ContactEntry[]
  /** 저장 콜백 (변경된 배열 전체 전달) */
  onSave: (entries: ContactEntry[]) => Promise<void>
  /** 라벨 마스터 테이블 이름 (phone_labels, email_labels 등) */
  labelTableName: string
  /** 입력 placeholder */
  inputPlaceholder?: string
  /** 항목이 없을 때 표시할 텍스트 */
  emptyPlaceholder?: string
  /** 항목 타입 라벨 (팝오버 헤더용: "연락처", "이메일") */
  typeLabel?: string
  /** 값 필드의 input type */
  inputType?: 'text' | 'email'
  /** 기본 라벨 (항목 추가 시 기본값) */
  defaultLabel?: string
}

export default function ContactInlineEditCell({
  entries,
  onSave,
  labelTableName,
  inputPlaceholder = '',
  emptyPlaceholder = '-',
  typeLabel = '연락처',
  inputType = 'text',
  defaultLabel = '대표',
}: ContactInlineEditCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localEntries, setLocalEntries] = useState<ContactEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)
  // 변경 추적 (팝오버 닫힐 때만 저장)
  const hasChangedRef = useRef(false)
  // 복사 상태
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // 팝오버 열릴 때 로컬 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setLocalEntries(entries.length > 0 ? entries.map(e => ({ ...e })) : [])
      hasChangedRef.current = false
    }
  }, [isOpen, entries])

  // 항목 추가
  const addEntry = useCallback(() => {
    setLocalEntries(prev => [...prev, { label: defaultLabel, value: '' }])
    hasChangedRef.current = true
  }, [defaultLabel])

  // 항목 삭제
  const removeEntry = useCallback((idx: number) => {
    setLocalEntries(prev => prev.filter((_, i) => i !== idx))
    hasChangedRef.current = true
  }, [])

  // 라벨 변경
  const updateLabel = useCallback((idx: number, label: string) => {
    setLocalEntries(prev => prev.map((e, i) => i === idx ? { ...e, label } : e))
    hasChangedRef.current = true
  }, [])

  // 값 변경
  const updateValue = useCallback((idx: number, value: string) => {
    setLocalEntries(prev => prev.map((e, i) => i === idx ? { ...e, value } : e))
    hasChangedRef.current = true
  }, [])

  // 복사
  const handleCopy = useCallback(async (value: string, idx: number) => {
    await navigator.clipboard.writeText(value)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }, [])

  // 저장 (팝오버 닫힐 때 호출)
  const handleSave = useCallback(async () => {
    if (!hasChangedRef.current) return
    // 빈 값 필터링
    const filtered = localEntries.filter(e => (e.value || '').trim())
    setIsSaving(true)
    try {
      await onSave(filtered)
    } catch (err) {
      console.error('[ContactInlineEditCell] 저장 오류:', err)
    } finally {
      setIsSaving(false)
    }
  }, [localEntries, onSave])

  // 팝오버 열기/닫기 핸들러
  const handleOpenChange = useCallback(async (open: boolean) => {
    if (!open && hasChangedRef.current) {
      // 닫힐 때 저장
      await handleSave()
    }
    setIsOpen(open)
  }, [handleSave])

  // 표시용 데이터
  const displayEntries = entries.filter(e => (e.value || '').trim())

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="w-full text-left text-sm px-1.5 py-0.5 -mx-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
        >
          {displayEntries.length > 0 ? (
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{displayEntries[0].label}</span>
              <span className="truncate">{displayEntries[0].value}</span>
              {displayEntries.length > 1 && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium flex-shrink-0">
                  +{displayEntries.length - 1}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">{emptyPlaceholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500">
            {typeLabel} ({localEntries.length})
          </p>
          {isSaving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        </div>

        {/* 항목 리스트 */}
        <div className="max-h-[240px] overflow-y-auto p-2 space-y-1.5">
          {localEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-1.5 group">
              {/* 라벨 선택 */}
              <LabelSelectPopover
                currentLabel={entry.label}
                onSelect={(label) => updateLabel(idx, label)}
                tableName={labelTableName}
                triggerWidth="w-[80px]"
              />
              {/* 값 입력 */}
              <Input
                type={inputType}
                value={entry.value}
                onChange={(e) => updateValue(idx, e.target.value)}
                placeholder={inputPlaceholder}
                className="h-9 text-sm flex-1"
              />
              {/* 복사 버튼 */}
              {(entry.value || '').trim() && (
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => handleCopy(entry.value, idx)}
                  title="복사"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {/* 삭제 버튼 */}
              <button
                type="button"
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={() => removeEntry(idx)}
                title="삭제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {localEntries.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">항목이 없습니다</p>
          )}
        </div>

        {/* 추가 버튼 */}
        <div className="border-t border-gray-100 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-gray-500 hover:text-blue-600"
            onClick={addEntry}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {typeLabel} 추가
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
