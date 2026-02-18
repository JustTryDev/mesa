'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 다크모드 상태 관리 스토어
 *
 * 비유: 방의 조명 스위치와 같습니다.
 * 스위치를 누르면 조명이 켜지거나 꺼지듯이,
 * toggleTheme()을 호출하면 라이트↔다크 모드가 전환됩니다.
 *
 * persist 미들웨어 덕분에 브라우저를 닫았다 열어도
 * 마지막으로 선택한 테마가 유지됩니다 (localStorage에 저장).
 */
export type Theme = 'light' | 'dark'

interface ThemeState {
  /** 현재 테마 */
  theme: Theme
  /** 특정 테마로 설정 */
  setTheme: (theme: Theme) => void
  /** 테마 토글 (light ↔ dark) */
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'mesa-theme',
    }
  )
)
