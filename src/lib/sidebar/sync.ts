/**
 * 사이드바 설정 동기화
 *
 * 코드에서 메뉴가 추가/삭제될 때 DB 설정과 동기화합니다.
 * - 새 메뉴 → config 끝에 자동 추가
 * - 삭제된 메뉴 → config에서 자동 제거
 */

import { getAllMenuIds } from '@/lib/constants/adminMenus'
import type { SidebarConfig, SidebarItem } from './types'

/**
 * config를 현재 adminMenus.ts와 동기화
 * @returns 변경이 있으면 새 config, 없으면 원본 반환
 */
export function syncConfigWithMenus(config: SidebarConfig): {
  config: SidebarConfig
  hasChanges: boolean
} {
  const allMenuIds = new Set(getAllMenuIds())

  // config에 포함된 모든 메뉴 ID 수집
  const configMenuIds = new Set<string>()
  for (const item of config.items) {
    if (item.type === 'menu') {
      configMenuIds.add(item.menuId)
    } else {
      item.children.forEach(id => configMenuIds.add(id))
    }
  }

  // 1. config에 없는 새 메뉴 찾기
  const newMenuIds = getAllMenuIds().filter(id => !configMenuIds.has(id))

  // 2. 삭제된 메뉴(코드에서 제거됨) 제거
  const cleanedItems: SidebarItem[] = config.items
    .map(item => {
      if (item.type === 'menu') {
        // 존재하지 않는 메뉴 제거
        return allMenuIds.has(item.menuId) ? item : null
      } else {
        // 폴더 내부에서 존재하지 않는 메뉴 제거
        const validChildren = item.children.filter(id => allMenuIds.has(id))
        return { ...item, children: validChildren }
      }
    })
    .filter((item): item is SidebarItem => item !== null)

  // 3. 새 메뉴를 끝에 추가
  const newItems: SidebarItem[] = newMenuIds.map(menuId => ({
    type: 'menu' as const,
    menuId,
  }))

  const hasChanges = newMenuIds.length > 0 || cleanedItems.length !== config.items.length
    || config.items.some((item, i) => {
      if (item.type === 'folder' && cleanedItems[i]?.type === 'folder') {
        return item.children.length !== (cleanedItems[i] as typeof item).children.length
      }
      return false
    })

  return {
    config: { items: [...cleanedItems, ...newItems] },
    hasChanges,
  }
}
