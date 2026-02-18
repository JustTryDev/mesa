'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_MENUS } from '@/lib/constants/adminMenus'

/**
 * 현재 pathname에서 메뉴 ID를 추출
 *
 * /admin/companies → 'companies'
 * /admin/alibaba-orders → 'alibaba-orders'
 * /admin → null (대시보드)
 */
function getMenuIdFromPathname(pathname: string): string | null {
  // /admin 대시보드는 권한 체크 불필요
  if (pathname === '/admin' || pathname === '/admin/') return null

  // ADMIN_MENUS에서 pathname과 일치하는 메뉴 찾기
  const menu = ADMIN_MENUS.find(m => pathname.startsWith(m.href))
  return menu?.id ?? null
}

interface MenuAccessGuardResult {
  /** 접근 허용 여부 */
  allowed: boolean
  /** 현재 페이지의 메뉴 ID (null이면 대시보드) */
  menuId: string | null
  /** 데이터 로딩 중 여부 */
  isLoading: boolean
}

/**
 * 현재 페이지의 메뉴 접근 권한을 확인하는 훅
 *
 * - admin/super_admin은 항상 허용
 * - staff는 메뉴 권한 테이블 확인
 * - /admin 대시보드는 모든 직원 접근 가능
 */
export function useMenuAccessGuard(): MenuAccessGuardResult {
  const pathname = usePathname()
  const { hasMenuAccess, isAdmin, isLoading, isUserDataReady, employee } = useAuth()

  const menuId = getMenuIdFromPathname(pathname)

  // 로딩 중
  if (isLoading || !isUserDataReady) {
    return { allowed: true, menuId, isLoading: true }
  }

  // 직원이 아닌 경우 (고객 등) — 별도 처리 필요 시 확장
  if (!employee) {
    return { allowed: false, menuId, isLoading: false }
  }

  // 대시보드는 모든 직원 접근 가능
  if (menuId === null) {
    return { allowed: true, menuId, isLoading: false }
  }

  // admin/super_admin은 항상 허용
  if (isAdmin) {
    return { allowed: true, menuId, isLoading: false }
  }

  // staff 권한 확인
  const allowed = hasMenuAccess(menuId)
  return { allowed, menuId, isLoading: false }
}
