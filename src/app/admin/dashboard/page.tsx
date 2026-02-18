'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * 어드민 대시보드 페이지
 *
 * 통계 카드 3개 + 빠른 링크를 표시합니다.
 */
export default function DashboardPage() {
  // 대시보드 통계 조회
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('통계 조회 실패')
      return res.json()
    },
  })

  const cards = [
    {
      label: '직원 수',
      value: stats?.data?.employeeCount ?? 0,
      icon: Users,
      href: '/admin/employees',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '고객 수',
      value: stats?.data?.customerCount ?? 0,
      icon: UserCheck,
      href: '/admin/customers',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: '공지사항',
      value: stats?.data?.noticeCount ?? 0,
      icon: FileText,
      href: '/admin/notices',
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">전체 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">
              자세히 보기
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 시작 가이드</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
            <p><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/app/globals.css</code>에서 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">--color-primary</code> 값을 변경하면 전체 브랜드 색상이 바뀝니다.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
            <p><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/lib/constants/adminMenus.ts</code>에 메뉴를 추가하면 사이드바에 자동 반영됩니다.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
            <p><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/app/admin/[메뉴ID]/page.tsx</code> 파일만 만들면 새 어드민 페이지가 완성됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
