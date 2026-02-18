/**
 * 고객 필터 영역 컴포넌트
 *
 * 비유: 도서관의 "검색 카드" 서랍장
 * - 이름으로 검색 (텍스트 검색)
 * - 소속 회사로 분류 (카테고리 필터)
 * - 구분(개인/법인)으로 분류 (카테고리 필터)
 *
 * 왜 분리했나?
 * 필터 UI는 독립적인 역할을 하므로, 테이블이나 데이터 로직과 분리하면
 * 나중에 필터 디자인만 변경하거나 새 필터를 추가할 때 이 파일만 수정하면 됨
 */
'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORY_OPTIONS } from '../constants'
import type { CompanyOption } from '../types'

interface CustomerFiltersProps {
  /** 검색어 */
  searchQuery: string
  /** 검색어 변경 핸들러 */
  onSearchChange: (value: string) => void
  /** 선택된 회사 필터 값 ('all' | 'personal' | 회사ID) */
  companyFilter: string
  /** 회사 필터 변경 핸들러 */
  onCompanyFilterChange: (value: string) => void
  /** 선택된 구분 필터 값 ('all' | 구분값) */
  categoryFilter: string
  /** 구분 필터 변경 핸들러 */
  onCategoryFilterChange: (value: string) => void
  /** 회사 목록 (드롭다운 옵션) */
  companies: CompanyOption[]
}

export default function CustomerFilters({
  searchQuery,
  onSearchChange,
  companyFilter,
  onCompanyFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  companies,
}: CustomerFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shrink-0">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 검색 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="이름, 이메일 또는 고객코드로 검색..."
            className="pl-9"
            type="search"
            name="search_cust_random"
          />
        </div>

        {/* 회사 필터 */}
        <Select value={companyFilter} onValueChange={onCompanyFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="소속 회사" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 고객</SelectItem>
            <SelectItem value="personal">개인 고객</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 구분 필터 */}
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="구분" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 구분</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
