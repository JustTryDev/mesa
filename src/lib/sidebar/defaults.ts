/**
 * 사이드바 기본 설정 생성
 *
 * DB에 설정이 없을 때(최초 접속) 현재 adminMenus.ts 기반으로
 * 기본 설정을 생성합니다.
 * 기존 website 그룹을 "웹사이트" 폴더로 자동 변환합니다.
 */

import { ADMIN_MENUS } from '@/lib/constants/adminMenus'
import type { SidebarConfig, SidebarItem } from './types'

/**
 * 기본 사이드바 설정 생성
 * website 그룹 메뉴를 폴더로 묶고, 나머지는 루트 메뉴로 배치
 */
export function generateDefaultConfig(): SidebarConfig {
  const websiteMenus = ADMIN_MENUS.filter(m => m.group === 'website')
  const regularMenus = ADMIN_MENUS.filter(m => m.group !== 'website')

  const items: SidebarItem[] = []

  // 일반 메뉴를 순서대로 추가
  for (const menu of regularMenus) {
    items.push({ type: 'menu', menuId: menu.id })
  }

  // 웹사이트 폴더 추가 (기존 하드코딩 폴더 마이그레이션)
  if (websiteMenus.length > 0) {
    // 주문 관리 그룹 뒤에 삽입 (기존 위치와 유사하게)
    const lastOrderIndex = items.findLastIndex(
      item => item.type === 'menu' && ADMIN_MENUS.find(m => m.id === item.menuId)?.group === 'orders'
    )
    const insertIndex = lastOrderIndex !== -1 ? lastOrderIndex + 1 : items.length

    items.splice(insertIndex, 0, {
      type: 'folder',
      id: 'folder-website',
      name: '웹사이트',
      children: websiteMenus.map(m => m.id),
    })
  }

  return { items }
}

/**
 * localStorage에 저장된 기존 순서를 반영한 설정 생성
 * 마이그레이션용: localStorage의 admin-menu-order를 DB 설정으로 변환
 */
export function migrateFromLocalStorage(): SidebarConfig | null {
  if (typeof window === 'undefined') return null

  const savedOrder = localStorage.getItem('admin-menu-order')
  if (!savedOrder) return null

  try {
    const orderIds: string[] = JSON.parse(savedOrder)
    const websiteMenus = ADMIN_MENUS.filter(m => m.group === 'website')

    // 저장된 순서대로 일반 메뉴 배열
    const regularItems: SidebarItem[] = orderIds
      .filter(id => ADMIN_MENUS.some(m => m.id === id && m.group !== 'website'))
      .map(id => ({ type: 'menu' as const, menuId: id }))

    // 순서에 없는 새 메뉴 추가
    const existingIds = new Set(orderIds)
    const newMenus: SidebarItem[] = ADMIN_MENUS
      .filter(m => m.group !== 'website' && !existingIds.has(m.id))
      .map(m => ({ type: 'menu' as const, menuId: m.id }))

    // 웹사이트 폴더
    const websiteFolder: SidebarItem | null = websiteMenus.length > 0
      ? {
          type: 'folder',
          id: 'folder-website',
          name: '웹사이트',
          children: websiteMenus.map(m => m.id),
        }
      : null

    const items: SidebarItem[] = [
      ...regularItems,
      ...newMenus,
      ...(websiteFolder ? [websiteFolder] : []),
    ]

    return { items }
  } catch {
    return null
  }
}
