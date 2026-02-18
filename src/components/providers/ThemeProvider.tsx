'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

/**
 * 테마 프로바이더 — html 태그에 dark 클래스를 토글
 *
 * 비유: 건물 전체의 조명을 제어하는 중앙 관제소와 같습니다.
 * 이 컴포넌트가 html 태그에 'dark' 클래스를 붙이거나 떼면,
 * Tailwind CSS의 dark: 접두사가 활성화/비활성화되어
 * 사이트 전체의 색상이 바뀝니다.
 *
 * 왜 useEffect를 쓰나요?
 * → html 태그는 React가 직접 관리하지 않는 영역이라,
 *   document.documentElement를 통해 직접 조작해야 합니다.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    // html 태그에 'dark' 클래스 추가/제거
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}
