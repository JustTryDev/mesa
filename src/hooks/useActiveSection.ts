'use client'

import { useState, useEffect } from 'react'

/**
 * 현재 스크롤 위치에서 활성화된 섹션을 추적하는 훅
 *
 * 비유: 엘리베이터의 층수 표시기와 같습니다.
 * 엘리베이터(스크롤)가 이동하면, 현재 몇 층(어떤 섹션)에 있는지
 * 자동으로 알려줍니다. Header에서 현재 보고 있는 메뉴를 하이라이트할 때 사용합니다.
 *
 * 왜 IntersectionObserver를 쓰나요?
 * → setInterval로 매초 스크롤 위치를 확인하는 것보다 훨씬 성능이 좋습니다.
 *   브라우저가 "이 요소가 화면에 보입니다"라고 자동으로 알려주는 방식이라,
 *   CPU를 거의 사용하지 않습니다.
 *
 * @param sectionIds - 추적할 섹션들의 HTML id 배열 (예: ['about', 'programs'])
 * @returns 현재 화면에 보이는 섹션의 id
 */
export function useActiveSection(sectionIds: string[]): string {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    // 서버 렌더링 환경에서는 window가 없으므로 건너뜀
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 해당 섹션이 화면의 관찰 영역 안에 들어왔을 때
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        // rootMargin: 상단 80px(헤더 높이)을 제외하고,
        // 하단 50%를 제외해서 "위쪽 절반에 보이는 섹션"을 활성으로 판단
        rootMargin: '-80px 0px -50% 0px',
        threshold: 0,
      }
    )

    // 각 섹션 요소를 관찰 대상으로 등록
    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    // 컴포넌트가 사라질 때 관찰 해제 (메모리 누수 방지)
    return () => observer.disconnect()
  }, [sectionIds])

  return activeSection
}
