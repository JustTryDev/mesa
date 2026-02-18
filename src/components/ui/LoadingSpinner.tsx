'use client'

/**
 * LoadingSpinner Component
 *
 * 인라인 로딩용 작은 곰인형 스케치 애니메이션
 * 목록 로딩, 버튼 옆 등 작은 공간에서 사용
 */

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  /** 크기 (기본값: 'md') */
  size?: 'sm' | 'md' | 'lg'
  /** 메시지 표시 여부 */
  showMessage?: boolean
  /** 커스텀 메시지 */
  message?: string
}

const SIZE_MAP = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-12 h-12', text: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-base' },
}

export function LoadingSpinner({
  size = 'md',
  showMessage = false,
  message = '로딩 중...',
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_MAP[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass.container} relative`}>
        <MiniSketchAnimation />
      </div>
      {showMessage && (
        <p className={`${sizeClass.text} text-gray-500 font-medium`}>{message}</p>
      )}
    </div>
  )
}

/**
 * 미니 곰인형 스케치 애니메이션
 */
function MiniSketchAnimation() {
  return (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
      {/* 머리 */}
      <motion.circle
        cx="50"
        cy="50"
        r="30"
        stroke="#1a2867"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      />

      {/* 왼쪽 귀 */}
      <motion.circle
        cx="28"
        cy="25"
        r="12"
        stroke="#1a2867"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          delay: 0.2,
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      />

      {/* 오른쪽 귀 */}
      <motion.circle
        cx="72"
        cy="25"
        r="12"
        stroke="#1a2867"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          delay: 0.4,
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      />

      {/* 왼쪽 눈 */}
      <motion.circle
        cx="40"
        cy="45"
        r="4"
        fill="#1a2867"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.2,
          delay: 0.8,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* 오른쪽 눈 */}
      <motion.circle
        cx="60"
        cy="45"
        r="4"
        fill="#1a2867"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.2,
          delay: 0.9,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* 코 */}
      <motion.ellipse
        cx="50"
        cy="55"
        rx="6"
        ry="5"
        fill="#ffd93d"
        stroke="#1a2867"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.2,
          delay: 1,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* 입 */}
      <motion.path
        d="M 44 62 Q 50 68 56 62"
        stroke="#1a2867"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.3,
          delay: 1.2,
          repeat: Infinity,
          repeatDelay: 1.7,
        }}
      />
    </svg>
  )
}

export default LoadingSpinner
