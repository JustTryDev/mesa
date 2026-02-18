/**
 * 반응형 패널 관리 훅
 *
 * 화면 크기에 따라 듀얼 패널 활성화 여부를 결정합니다.
 * - 1024px 이상: 듀얼 패널 가능
 * - 1024px 미만: 단일 패널만 (듀얼 패널 비활성화)
 */
'use client'

import { useState, useEffect } from 'react'
import { useAdminTabStore } from '@/stores/useAdminTabStore'

// 듀얼 패널 허용 최소 너비
const DUAL_PANEL_MIN_WIDTH = 1024

/**
 * 반응형 패널 관리 훅
 *
 * @returns {Object}
 * - isDualPanelAllowed: 현재 화면에서 듀얼 패널 허용 여부
 * - isMobile: 모바일 화면 여부 (1024px 미만)
 */
export function useResponsivePanel() {
  const [isDualPanelAllowed, setIsDualPanelAllowed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { layout, closePanel, hasTwoPanels } = useAdminTabStore()

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return

    const checkWidth = () => {
      const width = window.innerWidth
      const isWide = width >= DUAL_PANEL_MIN_WIDTH

      setIsDualPanelAllowed(isWide)
      setIsMobile(!isWide)

      // 모바일로 전환되었고 2개 패널이 열려있으면 두 번째 패널 닫기
      if (!isWide && hasTwoPanels()) {
        const state = useAdminTabStore.getState()
        const panels = state.layout.panels

        // 두 번째 패널을 동적으로 찾기 (하드코딩된 ID 대신)
        if (panels.length > 1) {
          const secondPanel = panels[1]
          const firstPanelId = panels[0].id

          // 두 번째 패널의 모든 탭을 첫 번째 패널로 이동
          secondPanel.tabs.forEach(tab => {
            state.moveTabToPanel(tab.id, secondPanel.id, firstPanelId)
          })
        }
      }
    }

    // 초기 체크
    checkWidth()

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkWidth)

    return () => {
      window.removeEventListener('resize', checkWidth)
    }
  }, [hasTwoPanels])

  return { isDualPanelAllowed, isMobile }
}
