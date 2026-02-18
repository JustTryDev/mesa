/**
 * 어드민 사이드바 메인 컴포넌트
 *
 * 레이아웃, 리사이즈, 반응형 처리를 담당합니다.
 * 메뉴/폴더 렌더링은 SidebarNav에 위임합니다.
 */
'use client'

import Link from 'next/link'
import { LogOut, Menu, Search } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebarConfigStore } from '@/stores/useSidebarConfigStore'
import { useSidebarCollapsedStore } from '@/stores/useSidebarCollapsedStore'
import SidebarNav from './SidebarNav'
import SidebarSearchDialog from './SidebarSearchDialog'
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_KEY } from './constants'

export default function AdminSidebar() {
  const { isLoading, fetchConfig } = useSidebarConfigStore()
  const { isCollapsed } = useSidebarCollapsedStore()
  const { employee } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 사이드바 너비 리사이즈 상태
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH.default)
  const isResizingRef = useRef(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isWidthLoaded, setIsWidthLoaded] = useState(false)

  // 리사이즈 핸들 ref
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  // 설정 불러오기
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // localStorage에서 사이드바 너비 복원
  useEffect(() => {
    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    if (savedWidth) {
      const width = Number(savedWidth)
      if (width >= SIDEBAR_WIDTH.min && width <= SIDEBAR_WIDTH.max) {
        setSidebarWidth(width)
      }
    }
    setIsWidthLoaded(true)
  }, [])

  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    isResizingRef.current = true
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // 리사이즈 중
  const handleResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return
    const newWidth = Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, e.clientX))
    setSidebarWidth(newWidth)
  }, [])

  // 리사이즈 종료
  const handleResizeEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    isResizingRef.current = false
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    setSidebarWidth(prev => {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(prev))
      return prev
    })
  }, [])

  // 더블클릭 시 기본값 리셋
  const handleResizeReset = useCallback(() => {
    setSidebarWidth(SIDEBAR_WIDTH.default)
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(SIDEBAR_WIDTH.default))
  }, [])

  const currentWidth = isCollapsed ? SIDEBAR_WIDTH.collapsed : sidebarWidth

  // 사용자 이름 첫 글자 (아바타용)
  const userName = employee?.name || '관리자'
  const avatarChar = userName.charAt(0)

  // 로드 전에는 렌더링하지 않음 (깜빡임 방지)
  if (!isWidthLoaded) return null

  const sidebarContent = (
    <>
      {/* 사용자 정보 영역 (노션 스타일) */}
      <div className="p-2 border-b border-gray-200 space-y-0.5">
        {/* 사용자 아바타 + 이름 */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
            {avatarChar}
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap overflow-hidden truncate">
              {userName}
            </span>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 text-xs"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden">검색</span>
          )}
        </button>
      </div>

      {/* 메뉴 네비게이션 */}
      {isLoading ? (
        // 스켈레톤 로딩
        <div className="flex-1 p-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <SidebarNav
          isCollapsed={isCollapsed}
          onMobileClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 하단 메뉴 */}
      <div className="p-2 border-t border-gray-200 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden">사이트</span>
          )}
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* 모바일 오버레이 */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* 모바일 사이드바 */}
      {isMobileOpen && (
        <aside
          className="lg:hidden fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-50 flex flex-col"
          style={{ width: SIDEBAR_WIDTH.default }}
        >
          {sidebarContent}
        </aside>
      )}

      {/* 데스크톱 사이드바 */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 flex-col z-30 overflow-hidden transition-[width] duration-200"
        style={{ width: currentWidth }}
      >
        {sidebarContent}

        {/* 리사이즈 핸들 */}
        {!isCollapsed && (
          <div
            ref={resizeHandleRef}
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onDoubleClick={handleResizeReset}
            className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-40 group touch-none"
          >
            <div
              className={`
                absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 transition-colors duration-150
                ${isResizing ? 'bg-blue-500' : 'group-hover:bg-blue-400'}
              `}
            />
          </div>
        )}
      </aside>

      {/* 사이드바 너비만큼 공간 확보 */}
      <div
        className="hidden lg:block flex-shrink-0 transition-[width] duration-200"
        style={{ width: currentWidth }}
      />

      {/* 메뉴 검색 다이얼로그 */}
      <SidebarSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
