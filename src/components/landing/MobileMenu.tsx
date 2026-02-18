'use client'

import { Instagram, Coffee, Youtube } from 'lucide-react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, SNS_LINKS } from '@/lib/constants/mesa'

/**
 * 모바일 햄버거 메뉴
 *
 * 비유: 식당의 접이식 메뉴판과 같습니다.
 * 평소에는 접혀있다가(닫힘), 버튼을 누르면 옆에서 슬라이드하며 펼쳐지고,
 * 메뉴를 선택하면 다시 접힙니다.
 *
 * shadcn/ui의 Sheet 컴포넌트를 재사용합니다.
 * Sheet는 화면 가장자리에서 슬라이드하는 패널로,
 * 모바일 네비게이션에 딱 맞는 UI 패턴입니다.
 */
interface MobileMenuProps {
  /** 메뉴 열림/닫힘 상태 */
  open: boolean
  /** 상태 변경 함수 */
  onOpenChange: (open: boolean) => void
  /** 메뉴 클릭 시 호출 — 해당 섹션으로 스크롤 */
  onNavClick: (sectionId?: string) => void
  /** 현재 활성 섹션 */
  activeSection: string
}

/** SNS 플랫폼별 아이콘 매핑 */
const snsIcons = {
  instagram: Instagram,
  'naver-cafe': Coffee,
  youtube: Youtube,
  email: ExternalLink,
}

export function MobileMenu({
  open,
  onOpenChange,
  onNavClick,
  activeSection,
}: MobileMenuProps) {
  // 메뉴 클릭 → 섹션 이동 + 메뉴 닫기
  const handleClick = (sectionId?: string) => {
    onNavClick(sectionId)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] bg-white dark:bg-zinc-950 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <SheetTitle className="text-left">
            <div className="relative h-7 w-[100px]">
              <Image
                src="/image/blacklogo.png"
                alt="MESA"
                fill
                className="object-contain object-left dark:hidden"
              />
              <Image
                src="/image/whitelogo.png"
                alt="MESA"
                fill
                className="object-contain object-left hidden dark:block"
              />
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* 네비게이션 메뉴 목록 */}
        <nav className="px-6 py-6">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.external ? (
                  /* 외부 링크 — 새 탭에서 열기 */
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onOpenChange(false)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  /* 내부 섹션 스크롤 */
                  <button
                    onClick={() => handleClick(item.sectionId)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      activeSection === item.sectionId
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                    )}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* SNS 링크 — 하단에 배치 */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-zinc-100">
          <div className="flex items-center gap-4">
            {SNS_LINKS.map((link) => {
              const Icon = snsIcons[link.platform]
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  aria-label={link.label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
