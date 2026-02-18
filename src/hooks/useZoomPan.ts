/**
 * useZoomPan - 스크롤 줌 + 드래그 팬 커스텀 훅
 *
 * 이미지, PDF, PSD 등 미리보기 컨테이너에서 공통으로 사용하는
 * 줌(확대/축소) + 팬(드래그 이동) 로직을 캡슐화합니다.
 *
 * @example
 * // 이미지/PSD용: 휠 = 줌
 * const zoom = useZoomPan()
 *
 * // PDF용: Ctrl+휠 = 줌, 일반 휠 = 스크롤 유지
 * const zoom = useZoomPan({ ctrlKeyRequired: true })
 */
import { useState, useRef, useCallback, useEffect } from 'react'

// 줌 범위 상수
const MIN_SCALE = 0.5
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.002

interface UseZoomPanOptions {
  /** true: Ctrl+휠만 줌, 일반 휠은 스크롤 (PDF용). false(기본): 모든 휠이 줌 */
  ctrlKeyRequired?: boolean
  /** false이면 모든 줌/팬 이벤트 무시 (기본값 true) */
  enabled?: boolean
}

interface UseZoomPanReturn {
  scale: number
  position: { x: number; y: number }
  isPanning: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  handleDoubleClick: () => void
  resetZoom: () => void
}

export function useZoomPan(options: UseZoomPanOptions = {}): UseZoomPanReturn {
  const { ctrlKeyRequired = false, enabled = true } = options

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 줌/위치 초기화
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 스크롤 줌 핸들러
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!enabled) return

    // ctrlKeyRequired 모드: Ctrl 없이 휠하면 기본 스크롤 유지
    if (ctrlKeyRequired && !e.ctrlKey) return

    e.preventDefault()
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    setScale(prev => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * (1 + delta)))
      // 줌이 1 근처로 돌아오면 위치도 리셋
      if (newScale <= 1.05 && newScale >= 0.95) {
        setPosition({ x: 0, y: 0 })
        return 1
      }
      return newScale
    })
  }, [enabled, ctrlKeyRequired])

  // wheel 이벤트를 passive: false로 등록 (preventDefault 사용을 위해)
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel, enabled])

  // 드래그 팬 핸들러 (ctrlKeyRequired 모드에서는 확대 시에만, 그 외는 항상 가능)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    if (ctrlKeyRequired && scale <= 1) return
    e.preventDefault()
    setIsPanning(true)
    panStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }, [enabled, ctrlKeyRequired, scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPosition({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    })
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // 더블클릭으로 줌 리셋
  const handleDoubleClick = useCallback(() => {
    if (!enabled) return
    resetZoom()
  }, [enabled, resetZoom])

  return {
    scale,
    position,
    isPanning,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    resetZoom,
  }
}
