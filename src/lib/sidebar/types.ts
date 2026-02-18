/**
 * 사이드바 설정 타입 정의
 *
 * DB에 저장되는 사이드바 구조를 타입으로 정의합니다.
 * 메뉴 정의(adminMenus.ts)는 하드코딩 유지하고,
 * 폴더 구조와 메뉴 배치만 DB에서 관리합니다.
 */

import { LucideIcon } from 'lucide-react'

// === DB에 저장되는 타입 (JSON 직렬화 가능) ===

/** 개별 메뉴 참조 (폴더 밖에 있는 메뉴) */
export interface SidebarMenuRef {
  type: 'menu'
  menuId: string // adminMenus.ts의 menu.id와 매칭
}

/** 폴더 */
export interface SidebarFolder {
  type: 'folder'
  id: string        // 폴더 고유 ID (예: 'folder-abc123')
  name: string      // 폴더 표시 이름 (예: '웹사이트')
  children: string[] // 폴더 안 메뉴 ID 배열 (순서 보존)
}

/** 사이드바 아이템 (메뉴 또는 폴더) */
export type SidebarItem = SidebarMenuRef | SidebarFolder

/** 사이드바 전체 설정 (DB에 저장) */
export interface SidebarConfig {
  items: SidebarItem[]
  labels?: Record<string, string> // 메뉴별 커스텀 라벨 (menuId → 표시 이름)
}

// === 클라이언트에서 사용하는 해석된(resolved) 타입 ===

/** 해석된 메뉴 아이템 (adminMenus.ts 데이터와 결합) */
export interface ResolvedMenuItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  group?: string
  externalUrl?: string
}

/** 해석된 폴더 (children이 메뉴 객체로 변환됨) */
export interface ResolvedFolder {
  type: 'folder'
  id: string
  name: string
  children: ResolvedMenuItem[]
}

/** 해석된 루트 메뉴 */
export interface ResolvedMenu {
  type: 'menu'
  item: ResolvedMenuItem
}

/** 해석된 사이드바 아이템 */
export type ResolvedSidebarItem = ResolvedMenu | ResolvedFolder

// === 드래그앤드롭 관련 타입 ===

/** 드래그 아이템의 메타데이터 */
export interface DragItemData {
  type: 'menu' | 'folder'
  containerId: string | null // 소속 폴더 ID (null = 루트)
  menuId?: string
  folderId?: string
}

// === 컨텍스트 메뉴 타입 ===

export interface SidebarContextMenuState {
  isOpen: boolean
  x: number
  y: number
  targetType: 'folder' | 'menu' | null
  targetId: string | null
}
