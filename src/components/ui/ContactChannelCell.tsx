/**
 * 연락 경로(Contact Channel) 인라인 편집 셀
 * 수입사 담당자의 연락 경로 (플랫폼 + ID) 목록을 관리
 * 클릭 → Popover 열림 → 채널 추가/수정/삭제 + 대표 지정 → 닫기 시 저장
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Loader2, X, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import LabelSelectPopover from '@/components/ui/LabelSelectPopover'

// 연락 경로 데이터 구조
interface ContactChannel {
  platform: string
  id: string
  is_primary?: boolean
}

interface ContactChannelCellProps {
  value: ContactChannel[]
  onSave: (channels: ContactChannel[]) => Promise<void>
  className?: string
}

export default function ContactChannelCell({
  value,
  onSave,
  className,
}: ContactChannelCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [channels, setChannels] = useState<ContactChannel[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)

  // 새 채널 추가용 입력 상태
  const [newPlatform, setNewPlatform] = useState('')
  const [newId, setNewId] = useState('')

  // 편집 중인 채널 인덱스 + 임시값
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editPlatform, setEditPlatform] = useState('')
  const [editId, setEditId] = useState('')

  // Popover 열릴 때의 초기값 (변경 감지용)
  const initialRef = useRef<ContactChannel[]>([])

  // Popover 열릴 때 채널값 동기화
  useEffect(() => {
    if (isOpen) {
      const current = value || []
      // 대표 채널을 최상단으로 정렬
      const sorted = [...current].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return 0
      })
      setChannels(sorted)
      initialRef.current = sorted.map(c => ({ ...c }))
      // 입력/편집 초기화
      setNewPlatform('')
      setNewId('')
      setEditingIndex(null)
    }
  }, [isOpen, value])

  // 채널 삭제
  const handleRemoveChannel = useCallback((index: number) => {
    setChannels(prev => prev.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }, [editingIndex])

  // 새 채널 추가 (id 빈칸 허용)
  const handleAddChannel = useCallback(() => {
    if (!newPlatform) return
    const trimmedId = newId.trim()
    // platform만 선택하고 id는 비워둘 수 있음
    setChannels(prev => [...prev, { platform: newPlatform, id: trimmedId }])
    setNewPlatform('')
    setNewId('')
  }, [newPlatform, newId])

  // 대표 토글 (최대 1개만 대표)
  const togglePrimary = useCallback((index: number) => {
    setChannels(prev => prev.map((ch, i) => ({
      ...ch,
      is_primary: i === index ? !ch.is_primary : false,
    })))
  }, [])

  // 인라인 편집 시작
  const startEdit = useCallback((index: number) => {
    setEditingIndex(index)
    setEditPlatform(channels[index].platform)
    setEditId(channels[index].id)
  }, [channels])

  // 인라인 편집 커밋
  const commitEdit = useCallback((index: number) => {
    if (editPlatform) {
      setChannels(prev => prev.map((ch, i) =>
        i === index ? { ...ch, platform: editPlatform, id: editId.trim() } : ch
      ))
    }
    setEditingIndex(null)
  }, [editPlatform, editId])

  // 변경 감지 함수
  const hasChanged = useCallback(
    (current: ContactChannel[], initial: ContactChannel[]): boolean => {
      if (current.length !== initial.length) return true
      return current.some(
        (ch, i) =>
          ch.platform !== initial[i].platform ||
          ch.id !== initial[i].id ||
          !!ch.is_primary !== !!initial[i].is_primary
      )
    },
    []
  )

  // Popover 닫힐 때 저장
  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (!open && isOpen) {
        // 편집 중이면 커밋
        if (editingIndex !== null) {
          commitEdit(editingIndex)
        }

        const initial = initialRef.current
        if (hasChanged(channels, initial)) {
          setIsSaving(true)
          setHasError(false)
          try {
            await onSave(channels)
          } catch {
            setHasError(true)
          } finally {
            setIsSaving(false)
          }
        }
      }
      setIsOpen(open)
    },
    [isOpen, channels, onSave, hasChanged, editingIndex, commitEdit]
  )

  // 저장 중 표시
  if (isSaving) {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
      </div>
    )
  }

  const displayChannels = value || []
  // 대표 채널을 우선 표시
  const primaryChannel = displayChannels.find(c => c.is_primary)
  const displayFirst = primaryChannel || displayChannels[0]

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
          {displayChannels.length > 0 && displayFirst ? (
            <div className="flex items-center gap-1">
              {/* 대표 아이콘 */}
              {primaryChannel && (
                <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" />
              )}
              {/* 첫 번째 채널 표시 */}
              <span className="truncate">
                <span className="text-gray-500">[{displayFirst.platform}]</span>{' '}
                {displayFirst.id || <span className="text-gray-400 italic">미입력</span>}
              </span>
              {/* 추가 채널 수 배지 */}
              {displayChannels.length > 1 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 flex-shrink-0"
                >
                  +{displayChannels.length - 1}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 현재 채널 목록 */}
        <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
          {channels.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              등록된 연락 경로가 없습니다
            </p>
          ) : (
            channels.map((channel, index) => (
              <div
                key={`${channel.platform}-${channel.id}-${index}`}
                className="flex items-center gap-1.5 group"
              >
                {/* 대표 토글 */}
                <button
                  type="button"
                  onClick={() => togglePrimary(index)}
                  className={cn(
                    'flex-shrink-0 p-0.5 rounded transition-colors',
                    channel.is_primary
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-300 hover:text-yellow-400'
                  )}
                  title={channel.is_primary ? '대표 해제' : '대표로 지정'}
                >
                  <Star className="w-3.5 h-3.5" fill={channel.is_primary ? 'currentColor' : 'none'} />
                </button>

                {editingIndex === index ? (
                  // 편집 모드
                  <>
                    <LabelSelectPopover
                      currentLabel={editPlatform}
                      onSelect={setEditPlatform}
                      tableName="platforms"
                      triggerWidth="w-24"
                    />
                    <Input
                      value={editId}
                      onChange={(e) => setEditId(e.target.value)}
                      onBlur={() => commitEdit(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(index) }
                        if (e.key === 'Escape') setEditingIndex(null)
                      }}
                      placeholder="아이디 (빈칸 가능)"
                      className="h-7 text-sm flex-1"
                      autoFocus
                    />
                  </>
                ) : (
                  // 표시 모드 (클릭 시 편집 진입)
                  <>
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => startEdit(index)}
                    >
                      {channel.platform}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="text-sm truncate flex-1 text-left hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                    >
                      {channel.id || <span className="text-gray-400 italic">미입력</span>}
                    </button>
                  </>
                )}

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => handleRemoveChannel(index)}
                  className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                  title="삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 새 채널 추가 */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            {/* 플랫폼 선택 (LabelSelectPopover - 추가/수정/삭제 가능) */}
            <LabelSelectPopover
              currentLabel={newPlatform || '플랫폼'}
              onSelect={setNewPlatform}
              tableName="platforms"
              triggerWidth="w-24"
            />
            {/* ID 입력 (빈칸 가능) */}
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChannel()
                }
              }}
              placeholder="아이디 (빈칸 가능)"
              className="h-7 text-sm flex-1"
            />
            {/* 추가 버튼 */}
            <button
              type="button"
              onClick={handleAddChannel}
              disabled={!newPlatform}
              className={cn(
                'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors',
                newPlatform
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400'
              )}
              title="채널 추가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
