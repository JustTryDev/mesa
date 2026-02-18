/**
 * 컴팩트 페이지네이션 컴포넌트
 *
 * 하단 중앙 고정, 높이 최소화된 페이지네이션.
 * 수입 주문 관리(alibaba-orders)에서 사용하던 컴포넌트를 공용화.
 */

'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompactPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  className?: string
}

export default function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
}: CompactPaginationProps) {
  // 페이지가 1개 이하면 표시하지 않음
  if (totalPages <= 1) return null

  // 표시할 페이지 번호 계산 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i)
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i)
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i)
    }

    return pages
  }

  const btnBase = 'flex items-center justify-center rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const btnSize = 'w-6 h-6 text-[11px]'

  return (
    <div className={cn(
      'flex items-center justify-center gap-0.5 py-1 bg-gray-50 border-t border-gray-200 shrink-0',
      className,
    )}>
      {/* 맨 처음 */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className={`${btnBase} ${btnSize} text-gray-500 hover:bg-gray-200`}
        title="맨 처음"
      >
        <ChevronsLeft className="w-3.5 h-3.5" />
      </button>

      {/* 이전 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className={`${btnBase} ${btnSize} text-gray-500 hover:bg-gray-200`}
        title="이전"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* 페이지 번호 */}
      {getPageNumbers().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          disabled={isLoading}
          className={`${btnBase} ${btnSize} ${
            currentPage === pageNum
              ? 'bg-[#1a2867] text-white font-semibold'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {pageNum}
        </button>
      ))}

      {/* 다음 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className={`${btnBase} ${btnSize} text-gray-500 hover:bg-gray-200`}
        title="다음"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 맨 끝 */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || isLoading}
        className={`${btnBase} ${btnSize} text-gray-500 hover:bg-gray-200`}
        title="맨 끝"
      >
        <ChevronsRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
