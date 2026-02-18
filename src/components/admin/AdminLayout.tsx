/**
 * 어드민 레이아웃 컴포넌트 (멀티 패널 탭 시스템)
 *
 * 구조:
 * ┌──────────────────────────────────────────────────┐
 * │ 사이드바 │ [패널 1]         │ [패널 2]           │
 * │          │ [탭 바]          │ [탭 바]            │
 * │          │─────────────────────│─────────────────────│
 * │          │ [콘텐츠]         │ [콘텐츠]           │
 * │          │                  │                    │
 * └──────────────────────────────────────────────────┘
 *
 * VS Code 스타일 듀얼 패널 지원:
 * - 최대 2개 패널 동시 표시
 * - 패널 간 리사이즈 가능
 * - 탭 드래그로 패널 분할
 */
'use client'

import { ShieldAlert } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import AdminPanelGroup from './AdminPanelGroup'
import { AdminHydrationProvider } from './AdminHydrationProvider'
import { useAdminNavigation } from '@/hooks/useAdminNavigation'
import { useMenuAccessGuard } from '@/hooks/useMenuAccessGuard'

interface AdminLayoutProps {
  children: React.ReactNode
}

/**
 * 접근 권한 없음 UI
 */
function AccessDenied() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">접근 권한이 없습니다</h2>
          <p className="text-sm text-gray-500 mt-1">
            이 페이지에 대한 접근 권한이 없습니다.<br />
            관리자에게 권한을 요청해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // URL ↔ 탭 자동 동기화
  useAdminNavigation()

  // 메뉴 접근 권한 확인
  const { allowed, isLoading } = useMenuAccessGuard()

  // 권한 확인 결과에 따라 콘텐츠 또는 차단 메시지 표시
  const content = !isLoading && !allowed ? <AccessDenied /> : children

  return (
    <AdminHydrationProvider>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* 사이드바 */}
        <AdminSidebar />

        {/* 메인 영역 (패널 그룹) */}
        <div className="flex-1 flex flex-col pt-16 lg:pt-0 min-h-0">
          <AdminPanelGroup>
            {content}
          </AdminPanelGroup>
        </div>
      </div>
    </AdminHydrationProvider>
  )
}
