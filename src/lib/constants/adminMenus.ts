/**
 * Admin 메뉴 상수 정의
 *
 * 모든 admin 메뉴를 한 곳에서 관리합니다.
 * 새 메뉴 추가 시 이 파일만 수정하면 사이드바 + 탭 시스템 모두 자동 반영!
 *
 * 새 메뉴를 추가하려면:
 * 1. 이 배열에 새 메뉴 객체 추가
 * 2. src/app/admin/{id}/page.tsx 파일 생성
 * → 끝! 사이드바와 탭 시스템에 자동 반영됩니다.
 */

import {
  FileText,
  Users,
  UserCheck,
  LayoutDashboard,
  Settings,
  LucideIcon,
} from "lucide-react"
import { ComponentType } from "react"

/**
 * Admin 메뉴 아이템 타입
 *
 * id: 고유 식별자 (URL 경로에도 사용)
 * label: 화면에 표시될 이름
 * href: 라우트 경로
 * icon: Lucide 아이콘 컴포넌트
 * group: 메뉴 그룹 (사이드바 섹션 구분용)
 * externalUrl: 외부 URL (설정 시 새 탭으로 열림)
 * component: 동적 import (탭 콘텐츠 렌더링용)
 */
export interface AdminMenu {
  id: string
  label: string
  href: string
  icon: LucideIcon
  group?: string
  externalUrl?: string
  component?: () => Promise<{ default: ComponentType }>
}

/**
 * Admin 메뉴 목록
 *
 * TODO: 프로젝트에 맞게 메뉴를 추가/수정하세요.
 * 그룹: content (콘텐츠), members (회원), settings (설정)
 */
export const ADMIN_MENUS: AdminMenu[] = [
  // === 콘텐츠 관리 ===
  {
    id: "dashboard",
    label: "대시보드",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    group: "content",
  },
  {
    id: "notices",
    label: "공지사항",
    href: "/admin/notices",
    icon: FileText,
    group: "content",
  },

  // === 회원 관리 ===
  {
    id: "employees",
    label: "직원 관리",
    href: "/admin/employees",
    icon: Users,
    group: "members",
  },
  {
    id: "customers",
    label: "고객 관리",
    href: "/admin/customers",
    icon: UserCheck,
    group: "members",
  },

  // === 설정 ===
  {
    id: "site-settings",
    label: "사이트 설정",
    href: "/admin/site-settings",
    icon: Settings,
    group: "settings",
  },
]

/**
 * 메뉴 그룹 정보 (사이드바에서 구분 표시)
 */
export const MENU_GROUPS: Record<string, string> = {
  content: "콘텐츠 관리",
  members: "회원 관리",
  settings: "설정",
}
