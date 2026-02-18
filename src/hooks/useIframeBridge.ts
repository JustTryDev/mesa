/**
 * iframe-부모 통신 브릿지 훅
 *
 * iframe 내부에서 부모 윈도우와 안전하게 통신
 * - postMessage를 통한 양방향 통신
 * - same-origin 검증으로 보안 확보
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * iframe 메시지 타입
 *
 * tabId: 탭 고유 식별자 (패널 간 이동 후에도 안정적인 라우팅 키)
 * panelId: 하위 호환용 (탭 이동 후 stale할 수 있음)
 */
export interface IframeMessage {
  type: 'NAVIGATE' | 'READY' | 'FORM_DIRTY' | 'SCROLL_POSITION' | 'FOCUS' | 'DOWNLOAD' | 'DOWNLOAD_ZIP'
  panelId: string
  tabId: string
  payload: unknown
}

/**
 * 네비게이션 메시지
 */
export interface NavigateMessage extends IframeMessage {
  type: 'NAVIGATE'
  payload: {
    path: string
    replace?: boolean
  }
}

/**
 * 준비 완료 메시지
 */
export interface ReadyMessage extends IframeMessage {
  type: 'READY'
  payload: null
}

/**
 * 다운로드 요청 메시지 (iframe → 부모)
 * sandboxed iframe에서 다운로드가 제한되므로, 부모 프레임에 위임
 *
 * 대용량 파일(50MB+)은 presignedUrl로 R2 직접 다운로드,
 * 소용량 파일은 url(프록시)로 다운로드
 */
export interface DownloadMessage extends IframeMessage {
  type: 'DOWNLOAD'
  payload: {
    url: string            // 프록시 다운로드 URL (?disposition=attachment 포함, 폴백용)
    fileName: string       // 저장할 파일명
    presignedUrl?: string  // R2 직접 다운로드 URL (대용량 파일용)
  }
}

/**
 * 다중 파일 ZIP 다운로드 요청 메시지 (iframe → 부모)
 * Cloudflare Worker가 R2에서 직접 ZIP을 스트리밍 생성
 */
export interface DownloadZipMessage extends IframeMessage {
  type: 'DOWNLOAD_ZIP'
  payload: {
    zipUrl: string       // Worker ZIP 다운로드 URL (HMAC 서명 포함)
    zipFileName: string  // ZIP 파일명
  }
}

/**
 * 폼 dirty 상태 메시지
 */
export interface FormDirtyMessage extends IframeMessage {
  type: 'FORM_DIRTY'
  payload: {
    isDirty: boolean
    formId?: string
  }
}

/**
 * iframe 브릿지 훅
 *
 * 사용 예:
 * ```tsx
 * const { isIframe, panelId, postToParent } = useIframeBridge()
 *
 * // 부모에게 메시지 전송
 * postToParent({ type: 'NAVIGATE', payload: { path: '/admin/notices/new' } })
 * ```
 */
export function useIframeBridge() {
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)

  // iframe 모드 여부 (useEffect로 hydration 안전하게 감지)
  const isIframeParam = searchParams.get('_iframe') === 'true'
  const [isEmbedded, setIsEmbedded] = useState(false)
  useEffect(() => {
    try {
      if (window.self !== window.top) setIsEmbedded(true)
    } catch {
      setIsEmbedded(true)
    }
  }, [])
  const isIframe = isIframeParam || isEmbedded

  // 패널/탭 ID: URL 파라미터 우선, useEffect에서 sessionStorage 폴백
  const paramPanelId = searchParams.get('_panelId') || ''
  const paramTabId = searchParams.get('_tabId') || ''
  const [panelId, setPanelId] = useState(paramPanelId)
  const [tabId, setTabId] = useState(paramTabId)

  // sessionStorage 저장/복원 (클라이언트에서만)
  useEffect(() => {
    try {
      if (paramPanelId) {
        sessionStorage.setItem('_iframe_panelId', paramPanelId)
        setPanelId(paramPanelId)
      } else {
        const stored = sessionStorage.getItem('_iframe_panelId')
        if (stored) setPanelId(stored)
      }

      if (paramTabId) {
        sessionStorage.setItem('_iframe_tabId', paramTabId)
        setTabId(paramTabId)
      } else {
        const stored = sessionStorage.getItem('_iframe_tabId')
        if (stored) setTabId(stored)
      }
    } catch {
      // sessionStorage 접근 불가 시 무시
    }
  }, [paramPanelId, paramTabId])

  // 부모에게 메시지 전송 (panelId + tabId 모두 포함)
  const postToParent = useCallback(
    (message: Omit<IframeMessage, 'panelId' | 'tabId'>) => {
      if (!isIframe || typeof window === 'undefined') return

      try {
        window.parent.postMessage(
          { ...message, panelId, tabId },
          window.location.origin
        )
      } catch (error) {
        console.error('[IframeBridge] Failed to post message:', error)
      }
    },
    [isIframe, panelId, tabId]
  )

  // 폼 dirty 상태 알림
  const notifyFormDirty = useCallback(
    (isDirty: boolean, formId?: string) => {
      postToParent({
        type: 'FORM_DIRTY',
        payload: { isDirty, formId },
      })
    },
    [postToParent]
  )

  // 부모로부터 메시지 수신 리스너 (tabId 우선 매칭, panelId 폴백)
  useEffect(() => {
    if (!isIframe || typeof window === 'undefined') return

    const handleMessage = (event: MessageEvent) => {
      // same-origin 검증
      if (event.origin !== window.location.origin) return

      const msg = event.data as IframeMessage
      // tabId 우선 매칭, 없으면 panelId로 폴백
      const isTargeted = msg.tabId
        ? msg.tabId === tabId
        : msg.panelId === panelId
      if (!isTargeted) return

      // 부모로부터의 명령 처리
      switch (msg.type) {
        case 'FOCUS':
          // 포커스 요청
          window.focus()
          break
        // 필요시 추가 메시지 타입 처리
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isIframe, panelId, tabId])

  // 준비 완료 상태
  useEffect(() => {
    if (isIframe) {
      setIsReady(true)
    }
  }, [isIframe])

  return {
    isIframe,
    panelId,
    tabId,
    isReady,
    postToParent,
    notifyFormDirty,
  }
}

/**
 * 부모 측에서 iframe 메시지를 수신하는 훅 (panelId 기반)
 *
 * @deprecated IframePool의 중앙 핸들러 사용 권장
 */
export function useIframeMessageListener(
  panelId: string,
  onMessage: (message: IframeMessage) => void
) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMessage = (event: MessageEvent) => {
      // same-origin 검증
      if (event.origin !== window.location.origin) return

      const message = event.data as IframeMessage
      if (!message.type || message.panelId !== panelId) return

      onMessage(message)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [panelId, onMessage])
}

/**
 * 중앙 집중식 iframe 메시지 리스너 (tabId 기반 라우팅)
 *
 * IframePool에서 사용. 모든 탭의 메시지를 수신하고 tabId로 라우팅합니다.
 * panelId와 무관하게 동작하므로 탭이 패널 간 이동해도 메시지 수신이 유지됩니다.
 */
export function useIframeCentralMessageListener(
  onMessage: (message: IframeMessage) => void
) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMessage = (event: MessageEvent) => {
      // same-origin 검증
      if (event.origin !== window.location.origin) return

      const message = event.data as IframeMessage
      if (!message.type || !message.tabId) return

      onMessage(message)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onMessage])
}
