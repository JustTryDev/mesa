/**
 * useImageLightbox — Dialog/Modal 안에서 이미지 확대 보기 훅
 *
 * 왜 이 훅이 필요한가?
 * Radix Dialog (shadcn Dialog 내부)는 모달이 열리면 body에 pointer-events: none을 설정.
 * 그래서 Dialog 안에서 새 팝업을 띄우면 클릭이 안 됨.
 *
 * 해결: createPortal로 라이트박스를 body에 직접 렌더링하고,
 *        pointerEvents: 'auto'로 클릭 가능하게 만듦.
 *
 * 비유: 아파트(Dialog) 관리사무소가 "외부인 출입 금지" 시켰는데,
 *        라이트박스는 아파트 밖 공원(body)에 설치해서 자유롭게 이용 가능하게 한 것
 *
 * 사용법:
 * ```tsx
 * const { openLightbox, LightboxPortal, preventDialogClose, lightbox } = useImageLightbox()
 *
 * return (
 *   <Dialog>
 *     <DialogContent
 *       onPointerDownOutside={preventDialogClose}
 *       onInteractOutside={preventDialogClose}
 *     >
 *       <img onClick={() => openLightbox(url, '제목')} />
 *     </DialogContent>
 *   </Dialog>
 *   {LightboxPortal}
 * )
 * ```
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// 라이트박스에 표시할 이미지 정보
interface LightboxState {
  url: string
  title?: string
}

/**
 * 이미지 확대 보기 훅
 * Dialog/Modal 안에서도 안전하게 작동하는 라이트박스를 제공
 */
export function useImageLightbox() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  // ── 라이트박스 열기 ──
  const openLightbox = useCallback((url: string, title?: string) => {
    setLightbox({ url, title })
  }, [])

  // ── 라이트박스 닫기 ──
  const closeLightbox = useCallback(() => {
    setLightbox(null)
  }, [])

  // ── ESC 키로 라이트박스만 닫기 (Dialog는 유지) ──
  // capture phase에서 이벤트를 가로채서 Radix의 ESC 핸들러보다 먼저 처리
  // 비유: "ESC 누름" 메시지가 Radix에 도착하기 전에 우리가 먼저 낚아채는 것
  useEffect(() => {
    if (!lightbox) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()  // Radix로 전파 차단
        setLightbox(null)
      }
    }
    // capture: true → 이벤트가 DOM 트리를 내려가는 "포획 단계"에서 먼저 처리
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [lightbox])

  // ── Dialog의 "바깥 클릭 시 닫기"를 라이트박스가 열려있을 때 차단 ──
  // onPointerDownOutside, onInteractOutside에 전달
  const preventDialogClose = useCallback(
    (e: { preventDefault: () => void }) => {
      if (lightbox) e.preventDefault()
    },
    [lightbox]
  )

  // ── 라이트박스 UI를 body에 직접 렌더링하는 Portal ──
  // useMemo가 아닌 즉시 계산: lightbox 상태가 바뀔 때마다 새로 렌더링해야 하므로
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  const LightboxPortal =
    typeof document !== 'undefined'
      ? createPortal(
          // AnimatePresence: 요소가 사라질 때 exit 애니메이션을 적용
          // 비유: 문을 닫을 때 "쾅" 대신 천천히 닫히는 도어 클로저
          <AnimatePresence>
            {lightbox && (
              <>
                {/* 배경 오버레이 — 클릭하면 라이트박스 닫힘 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeLightbox}
                  className="fixed inset-0 bg-black/70 z-[9990] cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                />
                {/* 이미지 컨테이너 — 중앙 정렬, 확대 애니메이션 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9991] max-w-[90vw] max-h-[90vh]"
                  style={{ pointerEvents: 'auto' }}
                >
                  {/* 상단 버튼들: 원본 보기 + 닫기 */}
                  <div className="absolute -top-10 right-0 flex gap-2">
                    {/* 원본 보기(새 탭) 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(lightbox.url, '_blank', 'noopener,noreferrer')
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="원본 보기"
                    >
                      {/* lucide-react Download 아이콘 대신 SVG 직접 사용 (훅 내부 JSX에서 import 최소화) */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    {/* 닫기 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeLightbox()
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  {/* 이미지 본체 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightbox.url}
                    alt={lightbox.title || '이미지'}
                    className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                  />
                  {/* 이미지 제목 (있는 경우만) */}
                  {lightbox.title && (
                    <p className="text-center text-white text-sm mt-3 opacity-70">
                      {lightbox.title}
                    </p>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      : null

  return {
    /** 현재 라이트박스 상태 (null이면 닫혀있음) */
    lightbox,
    /** 라이트박스 열기 */
    openLightbox,
    /** 라이트박스 닫기 */
    closeLightbox,
    /** body에 렌더링되는 라이트박스 Portal — JSX에 {LightboxPortal}로 배치 */
    LightboxPortal,
    /** Dialog의 onPointerDownOutside/onInteractOutside에 전달 */
    preventDialogClose,
  }
}
