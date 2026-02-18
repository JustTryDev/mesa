/**
 * 중앙 집중식 Iframe Pool 컴포넌트 (v3 - CSS 절대 포지셔닝)
 *
 * 모든 패널의 iframe을 단일 오버레이 레이어에서 렌더링합니다.
 *
 * 핵심 원리: CSS 절대 포지셔닝 + ResizeObserver
 * - 모든 iframe은 항상 IframePool div의 자식으로 존재 (DOM 이동 없음)
 * - ResizeObserver로 패널 content area의 좌표를 추적
 * - 탭이 패널 간 이동 시 CSS left/top/width/height만 변경
 * - iframe이 DOM에서 분리(detach)되지 않으므로 절대 새로고침 안 됨
 */
'use client'

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react'
import { useAdminTabStore, type Tab, type PanelLayout } from '@/stores/useAdminTabStore'
import { useIframeCentralMessageListener, type IframeMessage, type DownloadMessage, type DownloadZipMessage } from '@/hooks/useIframeBridge'
import { Loader2 } from 'lucide-react'

interface IframePoolProps {
  /** 패널별 콘텐츠 영역 DOM ref */
  panelContentRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
  /** IframePool 오버레이의 좌표 기준점 (AdminPanelGroup의 메인 wrapper) */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/** 전역 활성화 탭 추적 (lazy loading) */
const globalActivatedTabs = new Set<string>()

/** 패널 콘텐츠 영역의 상대 좌표 */
interface PanelRect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * iframe 로딩 상태 오버레이
 */
function IframeLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </div>
  )
}

/**
 * 패널-탭 매핑 정보 (iframe 배치에 사용)
 */
interface TabPlacement {
  tab: Tab
  panelId: string
  isActive: boolean
}

/**
 * 모든 패널에서 탭-패널 매핑 정보 수집
 */
function collectTabPlacements(layout: PanelLayout): TabPlacement[] {
  const placements: TabPlacement[] = []
  for (const panel of layout.panels) {
    for (const tab of panel.tabs) {
      placements.push({
        tab,
        panelId: panel.id,
        isActive: tab.id === panel.activeTabId,
      })
    }
  }
  return placements
}

export default function IframePool({ panelContentRefs, containerRef }: IframePoolProps) {
  const { layout, updateTabPath } = useAdminTabStore()
  const [activatedTabs, setActivatedTabs] = useState<Set<string>>(() => new Set(globalActivatedTabs))
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set())

  // 패널별 상대 좌표 (container 기준)
  const [panelRects, setPanelRects] = useState<Record<string, PanelRect>>({})

  // iframe src 캐시 (최초 렌더링 시 1회만 생성, 이후 변경 없음 → 리로드 방지)
  const iframeSrcCache = useRef<Record<string, string>>({})

  /** iframe src를 가져오거나 최초 생성 (캐시하여 리로드 방지) */
  const getOrCreateIframeSrc = useCallback((tab: Tab, panelId: string): string => {
    if (iframeSrcCache.current[tab.id]) {
      return iframeSrcCache.current[tab.id]
    }
    const src = `${tab.currentPath || tab.href}?_iframe=true&_panelId=${panelId}&_tabId=${tab.id}`
    iframeSrcCache.current[tab.id] = src
    return src
  }, [])

  // 탭-패널 매핑 정보 수집
  const placements = collectTabPlacements(layout)

  // 활성 탭 변경 시 activatedTabs 업데이트
  useEffect(() => {
    let changed = false
    for (const panel of layout.panels) {
      if (panel.activeTabId && !activatedTabs.has(panel.activeTabId)) {
        changed = true
        globalActivatedTabs.add(panel.activeTabId)
      }
    }
    if (changed) {
      setActivatedTabs(new Set(globalActivatedTabs))
    }
  }, [layout.panels, activatedTabs])

  // 닫힌 탭은 activatedTabs, src 캐시에서 제거
  useEffect(() => {
    const allTabIds = new Set(placements.map(p => p.tab.id))
    let changed = false
    for (const tabId of globalActivatedTabs) {
      if (!allTabIds.has(tabId)) {
        globalActivatedTabs.delete(tabId)
        delete iframeSrcCache.current[tabId]
        changed = true
      }
    }
    if (changed) {
      setActivatedTabs(new Set(globalActivatedTabs))
    }
  }, [placements])

  // ResizeObserver로 패널 content area 좌표 추적
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 좌표 계산 함수
    const updateRects = () => {
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect()
        const newRects: Record<string, PanelRect> = {}

        for (const [id, el] of Object.entries(panelContentRefs.current)) {
          if (!el) continue
          const r = el.getBoundingClientRect()
          newRects[id] = {
            top: r.top - containerRect.top,
            left: r.left - containerRect.left,
            width: r.width,
            height: r.height,
          }
        }

        setPanelRects(prev => {
          // 변경이 없으면 이전 객체 반환 (불필요한 리렌더 방지)
          const prevKeys = Object.keys(prev)
          const newKeys = Object.keys(newRects)
          if (prevKeys.length === newKeys.length) {
            let same = true
            for (const key of newKeys) {
              const p = prev[key]
              const n = newRects[key]
              if (!p || p.top !== n.top || p.left !== n.left || p.width !== n.width || p.height !== n.height) {
                same = false
                break
              }
            }
            if (same) return prev
          }
          return newRects
        })
      })
    }

    const observer = new ResizeObserver(updateRects)

    // container 자체도 observe (전체 레이아웃 변경 감지)
    observer.observe(container)

    // 각 패널 content area도 observe
    for (const el of Object.values(panelContentRefs.current)) {
      if (el) observer.observe(el)
    }

    // 최초 1회 좌표 계산
    updateRects()

    return () => observer.disconnect()
  // 패널 수 변경 시 observer 재설정
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, panelContentRefs, layout.panels.length])

  // 패널 content area ref가 변경될 때 observer 갱신을 위한 추가 effect
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 좌표 즉시 업데이트 (패널 간 탭 이동 시)
    const containerRect = container.getBoundingClientRect()
    const newRects: Record<string, PanelRect> = {}

    for (const [id, el] of Object.entries(panelContentRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      newRects[id] = {
        top: r.top - containerRect.top,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height,
      }
    }

    setPanelRects(prev => {
      const prevKeys = Object.keys(prev)
      const newKeys = Object.keys(newRects)
      if (prevKeys.length === newKeys.length) {
        let same = true
        for (const key of newKeys) {
          const p = prev[key]
          const n = newRects[key]
          if (!p || p.top !== n.top || p.left !== n.left || p.width !== n.width || p.height !== n.height) {
            same = false
            break
          }
        }
        if (same) return prev
      }
      return newRects
    })
  }, [containerRef, panelContentRefs, layout])

  // 중앙 집중식 메시지 핸들러 (tabId 기반 라우팅)
  const handleIframeMessage = useCallback((message: IframeMessage) => {
    switch (message.type) {
      case 'NAVIGATE': {
        const payload = message.payload as { path: string; tabId?: string }
        const targetTabId = payload.tabId || message.tabId
        if (targetTabId && payload.path) {
          updateTabPath(targetTabId, payload.path)
        }
        break
      }
      case 'READY': {
        const readyTabId = message.tabId
        if (readyTabId) {
          setLoadingTabs(prev => {
            const newSet = new Set(prev)
            newSet.delete(readyTabId)
            return newSet
          })
        }
        break
      }
      case 'DOWNLOAD': {
        // sandboxed iframe에서 다운로드 제한 → 부모 프레임에서 대신 실행
        const { url, fileName, presignedUrl } = message.payload as DownloadMessage['payload']

        // Presigned URL이 있으면 R2 직접 다운로드, 없으면 프록시 경유
        const downloadUrl = presignedUrl || url

        // 보안: presignedUrl이 없을 때(프록시)만 경로 검증
        if (!presignedUrl && !url.startsWith('/api/admin/file-management/download')) {
          console.error('[IframePool] 허용되지 않은 다운로드 URL:', url)
          break
        }

        // <a download> 직접 사용 → 브라우저 네이티브 다운로드 즉시 시작
        // IframePool은 sandbox 밖이므로 fetch→blob 없이 바로 다운로드 가능
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        break
      }
      case 'DOWNLOAD_ZIP': {
        // Worker URL로 직접 ZIP 다운로드 (브라우저 네이티브 다운로드)
        const { zipUrl, zipFileName } = message.payload as DownloadZipMessage['payload']

        const zipLink = document.createElement('a')
        zipLink.href = zipUrl
        zipLink.download = zipFileName
        document.body.appendChild(zipLink)
        zipLink.click()
        document.body.removeChild(zipLink)
        break
      }
      case 'FORM_DIRTY':
        // 폼 dirty 상태 (추후 탭 닫기 경고에 사용)
        break
    }
  }, [updateTabPath])

  useIframeCentralMessageListener(handleIframeMessage)

  // 렌더링할 탭 목록 (lazy loading 적용)
  const tabsToRender = placements.filter(
    p => activatedTabs.has(p.tab.id) || p.isActive
  )

  // CSS 절대 포지셔닝으로 각 iframe을 올바른 패널 위에 오버레이
  // iframe은 항상 이 div의 자식 → DOM 이동 없음 → 새로고침 없음
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {tabsToRender.map(({ tab, panelId, isActive }) => {
        const rect = panelRects[panelId]
        const isLoading = loadingTabs.has(tab.id)

        // rect가 아직 계산되지 않았으면 숨김
        const hasRect = rect && rect.width > 0 && rect.height > 0

        return (
          <div
            key={tab.id}
            style={{
              position: 'absolute',
              top: hasRect ? rect.top : 0,
              left: hasRect ? rect.left : 0,
              width: hasRect ? rect.width : 0,
              height: hasRect ? rect.height : 0,
              display: isActive && hasRect ? 'block' : 'none',
              pointerEvents: isActive ? 'auto' : 'none',
              overflow: 'hidden',
            }}
          >
            {/* 로딩 오버레이 */}
            {isLoading && isActive && <IframeLoadingOverlay />}

            {/* iframe - 캐시된 src로 패널 이동 시에도 유지 */}
            <iframe
              src={getOrCreateIframeSrc(tab, panelId)}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              allow="clipboard-write"
              onLoad={() => {
                setLoadingTabs(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(tab.id)
                  return newSet
                })
              }}
              title={`${tab.label} 탭`}
            />
          </div>
        )
      })}
    </div>
  )
}
