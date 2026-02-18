/**
 * 사이드바 설정 Store (Zustand)
 *
 * DB에서 폴더/메뉴 구조를 불러오고, 관리자가 변경한 내용을 저장합니다.
 * - config (폴더 구조, 메뉴 순서): DB 저장 (모든 사용자 공유)
 * - folderOpenState (접기/펼치기): localStorage 저장 (사용자별)
 */

import { create } from 'zustand'
import { ADMIN_MENUS } from '@/lib/constants/adminMenus'
import { generateDefaultConfig, migrateFromLocalStorage } from '@/lib/sidebar/defaults'
import { syncConfigWithMenus } from '@/lib/sidebar/sync'
import type {
  SidebarConfig,
  SidebarItem,
  SidebarFolder,
  ResolvedSidebarItem,
  ResolvedMenuItem,
} from '@/lib/sidebar/types'

// localStorage 키
const FOLDER_STATE_KEY = 'admin-folder-open-state'

interface SidebarConfigStore {
  // === 상태 ===
  config: SidebarConfig | null
  version: number
  isLoading: boolean
  isSaving: boolean
  folderOpenState: Record<string, boolean>
  isInitialized: boolean

  // === 초기화/저장 ===
  fetchConfig: () => Promise<void>
  saveConfig: (config: SidebarConfig) => Promise<boolean>

  // === 폴더 CRUD ===
  createFolder: (name: string) => void
  renameFolder: (folderId: string, newName: string) => void
  deleteFolder: (folderId: string) => void

  // === 메뉴 라벨 변경 ===
  renameMenu: (menuId: string, newLabel: string) => void
  resetMenuLabel: (menuId: string) => void

  // === 메뉴를 폴더에서 꺼내기 ===
  extractFromFolder: (menuId: string) => void

  // === 드래그 결과 적용 ===
  applyDragResult: (newConfig: SidebarConfig) => void

  // === 폴더 접기/펼치기 ===
  toggleFolder: (folderId: string) => void
  isFolderOpen: (folderId: string) => boolean

  // === 헬퍼 ===
  getResolvedItems: () => ResolvedSidebarItem[]
}

/**
 * adminMenus.ts에서 메뉴 정보를 찾아서 ResolvedMenuItem으로 변환
 */
function resolveMenuItem(menuId: string, labels?: Record<string, string>): ResolvedMenuItem | null {
  const menu = ADMIN_MENUS.find(m => m.id === menuId)
  if (!menu) return null
  return {
    id: menu.id,
    label: labels?.[menuId] || menu.label, // 커스텀 라벨 우선 사용
    href: menu.href,
    icon: menu.icon,
    group: menu.group,
  }
}

/**
 * SidebarConfig를 렌더링용 ResolvedSidebarItem 배열로 변환
 */
function resolveConfig(config: SidebarConfig): ResolvedSidebarItem[] {
  const labels = config.labels
  return config.items
    .map((item): ResolvedSidebarItem | null => {
      if (item.type === 'menu') {
        const resolved = resolveMenuItem(item.menuId, labels)
        if (!resolved) return null
        return { type: 'menu', item: resolved }
      } else {
        const children = item.children
          .map(id => resolveMenuItem(id, labels))
          .filter((c): c is ResolvedMenuItem => c !== null)
        return {
          type: 'folder',
          id: item.id,
          name: item.name,
          children,
        }
      }
    })
    .filter((item): item is ResolvedSidebarItem => item !== null)
}

// 디바운스 타이머
let saveTimeout: ReturnType<typeof setTimeout> | null = null

export const useSidebarConfigStore = create<SidebarConfigStore>()((set, get) => ({
  // === 초기 상태 ===
  config: null,
  version: 0,
  isLoading: true,
  isSaving: false,
  folderOpenState: {},
  isInitialized: false,

  // === DB에서 설정 불러오기 ===
  fetchConfig: async () => {
    // 이미 초기화됐으면 스킵
    if (get().isInitialized) return

    set({ isLoading: true })

    // localStorage에서 폴더 접기/펼치기 상태 복원
    let folderState: Record<string, boolean> = {}
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FOLDER_STATE_KEY)
        if (saved) folderState = JSON.parse(saved)

        // 기존 웹사이트 폴더 상태 마이그레이션
        const oldFolderState = localStorage.getItem('admin-website-folder-open')
        if (oldFolderState !== null && !saved) {
          folderState['folder-website'] = oldFolderState === 'true'
        }
      } catch { /* 무시 */ }
    }

    try {
      const res = await fetch('/api/admin/sidebar-config')
      if (!res.ok) throw new Error('설정 조회 실패')

      const data = await res.json()

      if (data.config) {
        // DB에 설정이 있으면 동기화 후 사용
        const { config: synced, hasChanges } = syncConfigWithMenus(data.config)
        set({
          config: synced,
          version: data.version || 0,
          isLoading: false,
          folderOpenState: folderState,
          isInitialized: true,
        })

        // 동기화로 변경사항이 있으면 자동 저장
        if (hasChanges) {
          get().saveConfig(synced)
        }
      } else {
        // DB에 설정이 없으면 기본값 또는 localStorage 마이그레이션
        const migrated = migrateFromLocalStorage()
        const config = migrated || generateDefaultConfig()

        set({
          config,
          version: 0,
          isLoading: false,
          folderOpenState: folderState,
          isInitialized: true,
        })

        // 기본값 DB에 저장
        get().saveConfig(config)

        // localStorage 마이그레이션 완료 후 정리
        if (typeof window !== 'undefined' && migrated) {
          localStorage.removeItem('admin-menu-order')
          localStorage.removeItem('admin-website-folder-open')
        }
      }
    } catch (error) {
      console.error('[SidebarConfig] 설정 로드 실패:', error)
      // 네트워크 오류 시 기본값 사용
      const config = generateDefaultConfig()
      set({
        config,
        version: 0,
        isLoading: false,
        folderOpenState: folderState,
        isInitialized: true,
      })
    }
  },

  // === DB에 설정 저장 ===
  saveConfig: async (config: SidebarConfig) => {
    set({ isSaving: true })

    try {
      const res = await fetch('/api/admin/sidebar-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          version: get().version,
        }),
      })

      if (!res.ok) throw new Error('저장 실패')

      const data = await res.json()
      set({ version: data.version || get().version + 1, isSaving: false })
      return true
    } catch (error) {
      console.error('[SidebarConfig] 저장 실패:', error)
      set({ isSaving: false })
      return false
    }
  },

  // === 폴더 생성 ===
  createFolder: (name: string) => {
    const { config } = get()
    if (!config) return

    const newFolder: SidebarFolder = {
      type: 'folder',
      id: `folder-${Date.now()}`,
      name,
      children: [],
    }

    const newConfig: SidebarConfig = {
      items: [...config.items, newFolder],
    }

    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 폴더 이름 변경 ===
  renameFolder: (folderId: string, newName: string) => {
    const { config } = get()
    if (!config) return

    const newConfig: SidebarConfig = {
      items: config.items.map(item =>
        item.type === 'folder' && item.id === folderId
          ? { ...item, name: newName }
          : item
      ),
    }

    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 폴더 삭제 (내부 메뉴를 폴더 위치에 펼침) ===
  deleteFolder: (folderId: string) => {
    const { config } = get()
    if (!config) return

    const folderIndex = config.items.findIndex(
      item => item.type === 'folder' && item.id === folderId
    )
    if (folderIndex === -1) return

    const folder = config.items[folderIndex] as SidebarFolder

    // 내부 메뉴를 폴더 위치에 펼쳐서 삽입
    const expandedItems: SidebarItem[] = folder.children.map(menuId => ({
      type: 'menu' as const,
      menuId,
    }))

    const newItems = [
      ...config.items.slice(0, folderIndex),
      ...expandedItems,
      ...config.items.slice(folderIndex + 1),
    ]

    const newConfig: SidebarConfig = { items: newItems }
    set({ config: newConfig })
    debouncedSave(get, newConfig)

    // 폴더 접기/펼치기 상태 정리
    const { folderOpenState } = get()
    const newFolderState = { ...folderOpenState }
    delete newFolderState[folderId]
    set({ folderOpenState: newFolderState })
    saveFolderState(newFolderState)
  },

  // === 메뉴 이름 변경 ===
  renameMenu: (menuId: string, newLabel: string) => {
    const { config } = get()
    if (!config) return

    const newConfig: SidebarConfig = {
      ...config,
      labels: { ...config.labels, [menuId]: newLabel },
    }

    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 메뉴 이름 기본값 복원 ===
  resetMenuLabel: (menuId: string) => {
    const { config } = get()
    if (!config || !config.labels?.[menuId]) return

    const newLabels = { ...config.labels }
    delete newLabels[menuId]

    const newConfig: SidebarConfig = {
      ...config,
      labels: Object.keys(newLabels).length > 0 ? newLabels : undefined,
    }

    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 메뉴를 폴더에서 루트로 꺼내기 ===
  extractFromFolder: (menuId: string) => {
    const { config } = get()
    if (!config) return

    // 어느 폴더에 있는지 찾기
    let parentFolderIndex = -1
    for (let i = 0; i < config.items.length; i++) {
      const item = config.items[i]
      if (item.type === 'folder' && item.children.includes(menuId)) {
        parentFolderIndex = i
        break
      }
    }
    if (parentFolderIndex === -1) return // 이미 루트에 있음

    // 폴더에서 제거
    const newItems: SidebarItem[] = config.items.map((item, i) => {
      if (i === parentFolderIndex && item.type === 'folder') {
        return { ...item, children: item.children.filter(id => id !== menuId) }
      }
      return item
    })

    // 폴더 바로 뒤에 루트 메뉴로 삽입
    newItems.splice(parentFolderIndex + 1, 0, { type: 'menu' as const, menuId })

    const newConfig: SidebarConfig = { ...config, items: newItems }
    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 드래그 결과 적용 (낙관적 업데이트) ===
  applyDragResult: (newConfig: SidebarConfig) => {
    set({ config: newConfig })
    debouncedSave(get, newConfig)
  },

  // === 폴더 접기/펼치기 ===
  toggleFolder: (folderId: string) => {
    const { folderOpenState } = get()
    const newState = {
      ...folderOpenState,
      [folderId]: !folderOpenState[folderId],
    }
    set({ folderOpenState: newState })
    saveFolderState(newState)
  },

  isFolderOpen: (folderId: string) => {
    return get().folderOpenState[folderId] ?? false
  },

  // === 해석된 아이템 (렌더링용) ===
  getResolvedItems: () => {
    const { config } = get()
    if (!config) return []
    return resolveConfig(config)
  },
}))

/**
 * 디바운스된 DB 저장 (500ms)
 */
function debouncedSave(
  get: () => SidebarConfigStore,
  config: SidebarConfig
) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    get().saveConfig(config)
  }, 500)
}

/**
 * 폴더 접기/펼치기 상태를 localStorage에 저장
 */
function saveFolderState(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FOLDER_STATE_KEY, JSON.stringify(state))
  } catch { /* 무시 */ }
}
