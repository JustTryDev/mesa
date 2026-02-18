/**
 * 사이드바 메뉴 검색 다이얼로그
 *
 * Ctrl+K 단축키 또는 검색 버튼 클릭으로 열리며,
 * ADMIN_MENUS에서 메뉴를 검색하여 바로 이동할 수 있습니다.
 */
'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { ADMIN_MENUS } from '@/lib/constants/adminMenus'
import { useAdminTabStore, selectActivePanelTabs } from '@/stores/useAdminTabStore'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SidebarSearchDialog({ open, onOpenChange }: SidebarSearchDialogProps) {
  const router = useRouter()
  const tabs = useAdminTabStore(selectActivePanelTabs)
  const { openTab, setActiveTab } = useAdminTabStore()
  const { isAdmin, hasMenuAccess } = useAuth()

  // Ctrl+K 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // 권한 기반 메뉴 필터링
  const visibleMenus = isAdmin
    ? ADMIN_MENUS
    : ADMIN_MENUS.filter(menu => hasMenuAccess(menu.id))

  // 메뉴 선택 핸들러
  const handleSelect = useCallback((menuId: string) => {
    const menu = ADMIN_MENUS.find(m => m.id === menuId)
    if (!menu) return

    // 외부 URL이면 새 탭으로 열기
    if (menu.externalUrl) {
      window.open(menu.externalUrl, '_blank', 'noopener,noreferrer')
      onOpenChange(false)
      return
    }

    // 기존 탭이 있으면 활성화, 없으면 새 탭 열기
    const existingTab = tabs.find(t => t.id === menu.id)
    if (existingTab) {
      setActiveTab(menu.id)
      router.push(existingTab.currentPath || menu.href)
    } else {
      openTab({ id: menu.id, label: menu.label, href: menu.href })
      router.push(menu.href)
    }
    onOpenChange(false)
  }, [tabs, setActiveTab, openTab, router, onOpenChange])

  // 그룹별 메뉴 정리
  const groupLabels: Record<string, string> = {
    content: '콘텐츠 관리',
    orders: '주문 관리',
    website: '외부 서비스',
    tools: '도구',
    members: '회원 관리',
  }

  const groupedMenus = visibleMenus.reduce<Record<string, typeof visibleMenus>>((acc, menu) => {
    const group = menu.group || 'etc'
    if (!acc[group]) acc[group] = []
    acc[group].push(menu)
    return acc
  }, {})

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="메뉴 검색"
      description="메뉴를 검색하여 바로 이동합니다"
      showCloseButton={false}
    >
      <CommandInput placeholder="메뉴 검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
        {Object.entries(groupedMenus).map(([group, menus]) => (
          <CommandGroup key={group} heading={groupLabels[group] || group}>
            {menus.map((menu) => {
              const Icon = menu.icon
              return (
                <CommandItem
                  key={menu.id}
                  value={menu.label}
                  onSelect={() => handleSelect(menu.id)}
                  className="cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  <span>{menu.label}</span>
                  {menu.externalUrl && (
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
