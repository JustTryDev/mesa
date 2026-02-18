'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 언어 상태 관리 스토어
 *
 * 비유: 리모컨의 언어 설정 버튼과 같습니다.
 * KR 버튼을 누르면 한국어, EN 버튼을 누르면 영어로
 * 사이트 전체의 텍스트가 바뀝니다.
 *
 * persist 미들웨어를 사용하면:
 * → 사용자가 영어로 바꾸고 브라우저를 닫았다 다시 열어도
 *   영어 상태가 유지됩니다 (localStorage에 저장).
 */
export type Language = 'ko' | 'en'

interface LanguageState {
  /** 현재 선택된 언어 */
  language: Language
  /** 언어 변경 함수 */
  setLanguage: (lang: Language) => void
  /** 언어 토글 (ko ↔ en) */
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ko',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((state) => ({
          language: state.language === 'ko' ? 'en' : 'ko',
        })),
    }),
    {
      name: 'mesa-language', // localStorage 키 이름
    }
  )
)
