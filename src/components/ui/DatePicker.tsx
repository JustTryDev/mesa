/**
 * 범용 날짜 선택 컴포넌트
 *
 * 비유: 벽걸이 달력을 클릭하면 날짜를 고를 수 있는 팝업이 뜨는 것
 * — 한국어 월/요일 표시, 오늘 날짜 강조, "날짜 해제" 기능
 *
 * 기존 DatePickerCell(인라인 셀 전용)과 달리,
 * 폼/필터 어디서든 쓸 수 있는 범용 인터페이스:
 *   value: 'YYYY-MM-DD' 문자열 (빈 문자열이면 미선택)
 *   onChange: (value: string) => void
 *
 * 사용 예시:
 * <DatePicker
 *   value={form.start_date}
 *   onChange={(v) => setForm(prev => ({ ...prev, start_date: v }))}
 *   placeholder="시작일 선택"
 *   minDate="2024-01-01"
 * />
 */
'use client'

import { useState } from 'react'
import { format, isBefore, isAfter, startOfDay, parseISO, endOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  /** 현재 선택된 날짜 ('YYYY-MM-DD' 형식, 빈 문자열이면 미선택) */
  value: string
  /** 날짜 변경 콜백 (빈 문자열 = 해제) */
  onChange: (value: string) => void
  /** 미선택 시 표시할 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 선택 가능한 최소 날짜 ('YYYY-MM-DD') */
  minDate?: string
  /** 선택 가능한 최대 날짜 ('YYYY-MM-DD') */
  maxDate?: string
  /** 추가 클래스명 */
  className?: string
}

export default function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 'YYYY-MM-DD' 문자열 → Date 객체 변환
  // 비유: "2024-02-18"이라는 텍스트를 달력에서 찾을 수 있는 날짜 객체로 바꾸는 것
  const selectedDate = value ? parseISO(value) : undefined

  // 날짜 선택 시
  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    // Date 객체 → 'YYYY-MM-DD' 문자열로 변환하여 onChange 호출
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  // "날짜 해제" 클릭 시 빈 문자열 전달
  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  // minDate/maxDate → Calendar의 disabled 매처 생성
  // 비유: "1월 1일 이전은 선택 못하게 잠가두는 것"
  const disabledMatcher = buildDisabledMatcher(minDate, maxDate)

  // 표시할 텍스트
  const displayText = selectedDate
    ? format(selectedDate, 'yyyy/MM/dd', { locale: ko })
    : null

  return (
    <Popover open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
            'flex items-center gap-2',
            'border-gray-200 bg-white hover:border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring',
            !displayText && 'text-gray-400',
            displayText && 'text-gray-900',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            className
          )}
        >
          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{displayText || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ko}
          disabled={disabledMatcher}
          defaultMonth={selectedDate}
          initialFocus
        />
        {/* 날짜가 선택된 상태일 때만 "날짜 해제" 버튼 표시 */}
        {selectedDate && (
          <div className="border-t px-3 py-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              날짜 해제
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * minDate/maxDate를 Calendar의 disabled 매처로 변환
 *
 * react-day-picker의 disabled prop은 다양한 형식을 지원:
 * - Date: 특정 날짜 비활성
 * - { before: Date }: 특정 날짜 이전 비활성
 * - { after: Date }: 특정 날짜 이후 비활성
 * - 배열: 여러 조건 조합
 */
/**
 * minDate/maxDate 문자열을 받아 react-day-picker의 disabled 함수 매처로 변환
 * 비유: "이 날짜 이전/이후는 달력에서 회색으로 잠가두는 규칙"
 *
 * { before: Date } / { after: Date } 객체 대신 함수 매처(Matcher = (date: Date) => boolean)를
 * 사용하면 TypeScript 타입 에러 없이 안전하게 날짜 범위를 제한할 수 있음
 */
function buildDisabledMatcher(
  minDate?: string,
  maxDate?: string
): ((date: Date) => boolean) | undefined {
  if (!minDate && !maxDate) return undefined

  return (date: Date) => {
    // minDate보다 이전이면 비활성화
    if (minDate) {
      const min = startOfDay(parseISO(minDate))
      if (isBefore(date, min)) return true
    }
    // maxDate보다 이후면 비활성화
    if (maxDate) {
      const max = endOfDay(parseISO(maxDate))
      if (isAfter(date, max)) return true
    }
    return false
  }
}
