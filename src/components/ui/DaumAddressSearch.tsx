/**
 * 다음 우편번호 검색 컴포넌트
 * - embed(레이어) 모드: 버튼 클릭 시 페이지 내 레이어로 주소 검색 표시
 * - popup 모드: 별도 팝업 창으로 주소 검색 (하위 호환)
 * - layerContainerRef: 부모가 레이어 렌더링 위치를 지정 (전체 너비 레이아웃용)
 * - 스크립트 동적 로딩 및 로딩 상태 관리
 */
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Script from 'next/script'
import { MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 다음 우편번호 API 전역 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: DaumPostcodeData) => void
        width?: string
        height?: string
      }) => {
        open: () => void
        embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void
      }
    }
  }
}

// 다음 우편번호 API 응답 데이터 타입
interface DaumPostcodeData {
  zonecode: string
  address: string
  addressEnglish: string
  addressType: string
  buildingName: string
  apartment: string
  roadAddress: string
  roadAddressEnglish: string
  jibunAddress: string
  jibunAddressEnglish: string
  autoRoadAddress: string
  autoJibunAddress: string
  userSelectedType: string
  bname: string
  bname1: string
  bname2: string
  sido: string
  sigungu: string
  sigunguCode: string
  roadnameCode: string
  roadname: string
  query: string
}

// 컴포넌트 props 인터페이스
interface DaumAddressSearchProps {
  onComplete: (data: { zonecode: string; address: string; buildingName: string }) => void
  /** embed: 페이지 내 레이어 (기본), popup: 별도 팝업 창 */
  mode?: 'embed' | 'popup'
  className?: string
  /** 레이어를 렌더링할 외부 컨테이너 ref (전체 너비 레이아웃용) */
  layerContainerRef?: React.RefObject<HTMLDivElement | null>
}

// embed 레이어 UI
function EmbedLayer({
  layerRef,
  onClose,
}: {
  layerRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden relative">
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
      {/* 다음 주소 검색 embed 영역 */}
      <div ref={layerRef} className="w-full h-[400px]" />
    </div>
  )
}

export default function DaumAddressSearch({
  onComplete,
  mode = 'embed',
  className,
  layerContainerRef,
}: DaumAddressSearchProps) {
  // next/script는 Dialog 내에서 재마운트 시 onLoad가 다시 호출되지 않으므로
  // 마운트 시 window.daum 존재 여부도 함께 체크
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  // embed 모드: 레이어 표시 여부
  const [showLayer, setShowLayer] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)

  // 컴포넌트 마운트 시 스크립트가 이미 로드되어 있으면 바로 활성화
  useEffect(() => {
    if (typeof window !== 'undefined' && window.daum) {
      setIsScriptLoaded(true)
    }
  }, [])

  // 주소 선택 완료 콜백
  const handleComplete = useCallback((data: DaumPostcodeData) => {
    onComplete({
      zonecode: data.zonecode,
      address: data.address,
      buildingName: data.buildingName,
    })
    // embed 모드면 레이어 닫기
    setShowLayer(false)
  }, [onComplete])

  // embed 초기화 (레이어 열릴 때 호출)
  const initEmbed = useCallback(() => {
    setTimeout(() => {
      if (layerRef.current) {
        layerRef.current.innerHTML = ''
        new window.daum.Postcode({
          oncomplete: handleComplete,
          width: '100%',
          height: '100%',
        }).embed(layerRef.current)
        // 레이어가 보이도록 자동 스크롤
        layerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 0)
  }, [handleComplete])

  // 버튼 클릭 핸들러
  const handleClick = useCallback(() => {
    if (!window.daum) return

    if (mode === 'popup') {
      new window.daum.Postcode({ oncomplete: handleComplete }).open()
    } else {
      // embed 모드: 레이어 토글
      if (showLayer) {
        setShowLayer(false)
        return
      }
      setShowLayer(true)
    }
  }, [mode, showLayer, handleComplete])

  // showLayer가 true로 변경되면 embed 초기화
  useEffect(() => {
    if (showLayer && mode === 'embed') {
      initEmbed()
    }
  }, [showLayer, mode, initEmbed])

  const handleClose = useCallback(() => setShowLayer(false), [])

  // embed 레이어 렌더링 (외부 컨테이너 또는 인라인)
  const renderEmbedLayer = () => {
    if (mode !== 'embed' || !showLayer) return null

    const layer = <EmbedLayer layerRef={layerRef} onClose={handleClose} />

    // 외부 컨테이너가 지정되면 createPortal로 렌더링
    if (layerContainerRef?.current) {
      return createPortal(layer, layerContainerRef.current)
    }

    // 기본: 버튼 아래에 인라인 렌더링
    return layer
  }

  return (
    <div className="relative">
      {/* 다음 우편번호 API 스크립트 동적 로딩 */}
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />

      {/* 주소 검색 버튼 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(className)}
        onClick={handleClick}
        disabled={!isScriptLoaded}
      >
        <MapPin className="w-3.5 h-3.5 mr-1" />
        {showLayer ? '닫기' : '주소 검색'}
      </Button>

      {/* embed 레이어 (인라인 fallback) */}
      {renderEmbedLayer()}
    </div>
  )
}
