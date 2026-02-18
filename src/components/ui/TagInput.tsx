/**
 * 태그 입력 컴포넌트 (폼용)
 * 텍스트 입력 → Enter/추가 버튼 → 태그 생성, X 클릭 → 삭제
 * DB 연동 없이 순수 로컬 상태로 동작
 */
'use client'

import { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  badgeClassName?: string
  className?: string
  maxTags?: number
}

export default function TagInput({
  value,
  onChange,
  placeholder = '입력 후 Enter...',
  badgeClassName = 'bg-purple-50 text-purple-700 border-purple-200',
  className,
  maxTags,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return // 중복 방지
    if (maxTags && value.length >= maxTags) return
    onChange([...value, trimmed])
    setInputValue('')
  }, [inputValue, value, onChange, maxTags])

  const removeTag = useCallback((tag: string) => {
    onChange(value.filter(v => v !== tag))
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={cn('pr-1 gap-1', badgeClassName)}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 text-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTag}
          disabled={!inputValue.trim()}
          className="h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          추가
        </Button>
      </div>
    </div>
  )
}
