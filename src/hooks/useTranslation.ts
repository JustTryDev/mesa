'use client'

import { useLanguageStore } from '@/stores/useLanguageStore'
import { translations } from '@/lib/i18n/translations'
import type { Translations } from '@/lib/i18n/translations'

/**
 * 다국어 번역 훅
 *
 * 비유: 동시통역사와 같습니다.
 * 현재 설정된 언어(ko/en)에 맞는 텍스트를 자동으로 골라줍니다.
 *
 * @example
 * const { t, language, toggleLanguage } = useTranslation()
 * <h1>{t.hero.title}</h1>  // "MESA" (양쪽 동일)
 * <p>{t.hero.description}</p>  // 한국어 or 영어
 * <button onClick={toggleLanguage}>
 *   {language === 'ko' ? 'EN' : 'KR'}
 * </button>
 */
export function useTranslation() {
  const { language, toggleLanguage, setLanguage } = useLanguageStore()

  // 현재 언어에 맞는 번역 데이터를 가져옴
  const t: Translations = translations[language]

  return {
    /** 현재 언어의 번역 데이터 */
    t,
    /** 현재 언어 코드 ('ko' | 'en') */
    language,
    /** 언어 토글 (ko ↔ en) */
    toggleLanguage,
    /** 특정 언어로 직접 설정 */
    setLanguage,
  }
}
