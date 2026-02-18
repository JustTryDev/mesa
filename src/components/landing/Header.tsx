'use client'

import { useState, useEffect, useMemo } from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants/mesa'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useTranslation } from '@/hooks/useTranslation'
import { useThemeStore } from '@/stores/useThemeStore'
import { MobileMenu } from './MobileMenu'

/**
 * 고정 상단 네비게이션 헤더
 *
 * 비유: 건물 1층 로비의 안내 데스크와 같습니다.
 * 항상 같은 위치에 있어서(fixed), 어느 층(섹션)에서든
 * 다른 층으로 이동할 수 있는 안내판 역할을 합니다.
 *
 * 특징:
 * 1. 히어로 위에서는 투명 → 스크롤하면 흰색 배경으로 전환
 * 2. 현재 보고 있는 섹션의 메뉴가 하이라이트됨
 * 3. 모바일에서는 햄버거 메뉴로 변환
 * 4. KR/EN 언어 토글 버튼 (국기 아이콘 포함)
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t, language, toggleLanguage } = useTranslation()
  const { theme, toggleTheme } = useThemeStore()

  // 현재 활성 섹션 추적 (메뉴 하이라이트용)
  const sectionIds = useMemo(
    () => NAV_ITEMS.map((item) => item.sectionId).filter(Boolean) as string[],
    []
  )
  const activeSection = useActiveSection(sectionIds)

  // 스크롤 이벤트 감지 — 80px 이상 내리면 "스크롤됨" 상태
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 메뉴 클릭 시 해당 섹션으로 부드럽게 이동
  const handleNavClick = (sectionId?: string) => {
    if (!sectionId) return
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 80
      const top = element.getBoundingClientRect().top + window.scrollY - headerHeight
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // 네비게이션 라벨을 번역 데이터에서 가져옴
  const navLabels: Record<string, string> = {
    About: t.nav.about,
    Activities: t.nav.activities,
    Archive: t.nav.archive,
    Notice: t.nav.notice,
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'header-scrolled' : 'header-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex h-20 items-center justify-between">
          {/* 로고 — 스크롤 상태에 따라 흰/검 로고 전환 */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="relative h-8 w-[120px] shrink-0"
          >
            {/* 흰색 로고 — 스크롤 전(투명 헤더) 또는 다크모드 스크롤 후에 표시 */}
            <Image
              src="/image/whitelogo.png"
              alt="MESA"
              fill
              className={cn(
                'object-contain object-left transition-opacity duration-300',
                scrolled ? 'opacity-0 dark:opacity-100' : 'opacity-100'
              )}
              priority
            />
            {/* 검정 로고 — 스크롤 후(흰색 헤더)에 표시, 다크모드에서는 숨김 */}
            <Image
              src="/image/blacklogo.png"
              alt="MESA"
              fill
              className={cn(
                'object-contain object-left transition-opacity duration-300',
                scrolled ? 'opacity-100 dark:opacity-0' : 'opacity-0'
              )}
              priority
            />
          </button>

          {/* 데스크톱: 네비게이션 + 언어 토글 */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.sectionId)}
                className={cn(
                  'text-sm font-medium transition-colors relative py-1',
                  activeSection === item.sectionId
                    ? scrolled
                      ? 'text-zinc-900 dark:text-white'
                      : 'text-white'
                    : scrolled
                      ? 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                      : 'text-zinc-400 hover:text-white',
                  activeSection === item.sectionId &&
                    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-current'
                )}
              >
                {navLabels[item.label] || item.label}
              </button>
            ))}

            {/* 언어 토글 버튼 — 국기 아이콘 포함 */}
            <button
              onClick={toggleLanguage}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                scrolled
                  ? 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                  : 'border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400'
              )}
            >
              <span className="text-sm leading-none">{language === 'ko' ? '\u{1F1FA}\u{1F1F8}' : '\u{1F1F0}\u{1F1F7}'}</span>
              {language === 'ko' ? 'EN' : 'KR'}
            </button>

            {/* 다크모드 토글 버튼 */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-full transition-all',
                scrolled
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              aria-label={theme === 'light' ? '다크모드' : '라이트모드'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 모바일: 언어 토글 + 다크모드 + 햄버거 */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all',
                scrolled
                  ? 'border-zinc-300 text-zinc-600'
                  : 'border-zinc-600 text-zinc-400'
              )}
            >
              <span className="text-sm leading-none">{language === 'ko' ? '\u{1F1FA}\u{1F1F8}' : '\u{1F1F0}\u{1F1F7}'}</span>
              {language === 'ko' ? 'EN' : 'KR'}
            </button>
            <button
              onClick={toggleTheme}
              className={cn(
                'p-1.5 rounded-full transition-all',
                scrolled
                  ? 'text-zinc-600 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:bg-white/10'
              )}
              aria-label={theme === 'light' ? '다크모드' : '라이트모드'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                'p-2 transition-colors',
                scrolled ? 'text-zinc-900' : 'text-white'
              )}
              aria-label="메뉴 열기"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </div>

      {/* 모바일 메뉴 (Sheet) */}
      <MobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onNavClick={handleNavClick}
        activeSection={activeSection}
      />
    </header>
  )
}
