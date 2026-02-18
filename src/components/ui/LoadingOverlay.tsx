'use client'

/**
 * LoadingOverlay Component
 *
 * 캐릭터 스케치 드로잉 애니메이션이 포함된 로딩 오버레이
 * SVG stroke-dashoffset을 활용한 라인 드로잉 효과
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface LoadingOverlayProps {
  isOpen: boolean
  /** 로딩 메시지 (기본값: "잠시만 기다려주세요") */
  message?: string
  /** 서브 메시지 */
  subMessage?: string
  /** 로딩 오버레이 표시 지연 시간 (ms). 이 시간 이상 로딩이 걸릴 때만 표시 (기본값: 300ms) */
  delay?: number
}

// 랜덤 로딩 메시지
const LOADING_MESSAGES = [
  '특별한 작품을 준비 중이에요',
  '상상을 현실로 그리는 중이에요',
  '캐릭터에 생명을 불어넣는 중이에요',
  '마법 같은 순간을 만들고 있어요',
  '당신만의 작품이 탄생하고 있어요',
]

export function LoadingOverlay({
  isOpen,
  message,
  subMessage,
  delay = 300, // 기본 300ms 이상 로딩 시에만 표시
}: LoadingOverlayProps) {
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0])
  const [shouldShow, setShouldShow] = useState(false)

  // delay 시간 이상 로딩이 지속될 때만 오버레이 표시
  useEffect(() => {
    if (!isOpen) {
      setShouldShow(false)
      return
    }

    // delay 후에 오버레이 표시
    const timer = setTimeout(() => {
      setShouldShow(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [isOpen, delay])

  // 3초마다 메시지 변경
  useEffect(() => {
    if (!shouldShow) return

    const interval = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev)
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length
        return LOADING_MESSAGES[nextIndex]
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [shouldShow])

  return (
    <AnimatePresence>
      {shouldShow && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* 로딩 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] text-center"
          >
            {/* 스케치 애니메이션 컨테이너 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
              {/* SVG 캐릭터 드로잉 애니메이션 */}
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 relative">
                <SketchAnimation />

                {/* 연필 아이콘 (드로잉 효과) */}
                <motion.div
                  className="absolute -right-2 -bottom-2"
                  animate={{
                    rotate: [0, -10, 0, 10, 0],
                    x: [0, 2, 0, -2, 0],
                    y: [0, -2, 0, 2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffd93d"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </motion.div>
              </div>

              {/* 메시지 */}
              <motion.p
                key={message || currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-gray-900"
              >
                {message || currentMessage}
              </motion.p>

              {subMessage && (
                <p className="text-sm text-gray-500 mt-2">{subMessage}</p>
              )}

              {/* 점 애니메이션 */}
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-brand-primary"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * 곰인형 스케치 애니메이션
 * stroke-dashoffset을 활용한 라인 드로잉 효과
 */
function SketchAnimation() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className="w-full h-full"
    >
      {/* 곰인형 머리 */}
      <motion.circle
        cx="50"
        cy="45"
        r="28"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />

      {/* 왼쪽 귀 */}
      <motion.circle
        cx="28"
        cy="22"
        r="10"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          delay: 0.3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* 오른쪽 귀 */}
      <motion.circle
        cx="72"
        cy="22"
        r="10"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          delay: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* 왼쪽 눈 */}
      <motion.circle
        cx="40"
        cy="40"
        r="3"
        stroke="#1a2867"
        strokeWidth="2"
        fill="#1a2867"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: 1.2,
          repeat: Infinity,
          repeatDelay: 2.7,
        }}
      />

      {/* 오른쪽 눈 */}
      <motion.circle
        cx="60"
        cy="40"
        r="3"
        stroke="#1a2867"
        strokeWidth="2"
        fill="#1a2867"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: 1.4,
          repeat: Infinity,
          repeatDelay: 2.7,
        }}
      />

      {/* 코 */}
      <motion.ellipse
        cx="50"
        cy="50"
        rx="5"
        ry="4"
        stroke="#1a2867"
        strokeWidth="2"
        fill="#ffd93d"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: 1.6,
          repeat: Infinity,
          repeatDelay: 2.7,
        }}
      />

      {/* 입 (미소) */}
      <motion.path
        d="M 44 56 Q 50 62 56 56"
        stroke="#1a2867"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.5,
          delay: 1.8,
          repeat: Infinity,
          repeatDelay: 2.5,
        }}
      />

      {/* 몸통 */}
      <motion.ellipse
        cx="50"
        cy="85"
        rx="18"
        ry="12"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          delay: 0.8,
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      />

      {/* 왼쪽 팔 */}
      <motion.path
        d="M 32 80 Q 22 85 25 92"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.8,
          delay: 2,
          repeat: Infinity,
          repeatDelay: 2.2,
        }}
      />

      {/* 오른쪽 팔 */}
      <motion.path
        d="M 68 80 Q 78 85 75 92"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.8,
          delay: 2.2,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />
    </svg>
  )
}

export default LoadingOverlay
