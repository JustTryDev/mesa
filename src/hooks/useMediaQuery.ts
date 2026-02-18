'use client'

import { useState, useEffect } from 'react'

/**
 * 미디어 쿼리 훅
 * 화면 크기에 따라 모바일/데스크톱 여부를 판단합니다.
 *
 * @param query - 미디어 쿼리 문자열 (예: "(max-width: 768px)")
 * @returns 쿼리 매칭 여부
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)")
 * const isTablet = useMediaQuery("(max-width: 1024px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // SSR 환경에서는 window 객체가 없으므로 early return
    if (typeof window === "undefined") return

    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
