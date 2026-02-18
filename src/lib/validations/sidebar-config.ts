/**
 * 사이드바 설정 Zod 검증 스키마
 */

import { z } from 'zod'

// 개별 메뉴 참조
const menuRefSchema = z.object({
  type: z.literal('menu'),
  menuId: z.string().min(1),
})

// 폴더
const folderSchema = z.object({
  type: z.literal('folder'),
  id: z.string().min(1),
  name: z.string().min(1).max(30),
  children: z.array(z.string().min(1)),
})

// 사이드바 아이템 (메뉴 또는 폴더)
const sidebarItemSchema = z.discriminatedUnion('type', [menuRefSchema, folderSchema])

// 사이드바 전체 설정
export const sidebarConfigSchema = z.object({
  items: z.array(sidebarItemSchema),
  labels: z.record(z.string(), z.string().max(30)).optional(), // 메뉴별 커스텀 라벨
}).refine((config) => {
  // 메뉴 ID 중복 검사
  const allRefs: string[] = []
  for (const item of config.items) {
    if (item.type === 'menu') {
      allRefs.push(item.menuId)
    } else {
      allRefs.push(...item.children)
    }
  }
  return allRefs.length === new Set(allRefs).size
}, { message: '중복된 메뉴 참조가 있습니다.' })
