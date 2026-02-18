'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * Spline 3D를 dynamic import로 로드
 *
 * 왜 dynamic import를 쓰나요?
 * → Spline 3D는 파일 크기가 큽니다. dynamic import를 쓰면
 *   페이지가 처음 열릴 때 필수 코드만 먼저 로드하고,
 *   3D 씬은 나중에 불러옵니다. 마치 식당에서 메인 요리를 먼저 주고,
 *   디저트는 나중에 가져오는 것과 같습니다.
 *
 * ssr: false → 서버에서는 렌더링하지 않음 (3D는 브라우저에서만 동작)
 */
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    // 3D가 로드되는 동안 보여줄 placeholder
    <div className="w-full h-full bg-zinc-900" />
  ),
})

/**
 * 타이핑 애니메이션 컴포넌트
 *
 * 비유: 타자기처럼 한 글자씩 화면에 찍히는 효과입니다.
 * 텍스트를 한 글자씩 쪼개서, 일정 간격(speed)으로 하나씩 보여줍니다.
 * 다 타이핑된 후에는 커서(|)가 깜빡이는 효과도 있습니다.
 */
function TypingAnimation({
  text,
  delay = 1000,
  speed = 40,
  className,
}: {
  text: string
  delay?: number
  speed?: number
  className?: string
}) {
  // displayedText: 현재까지 화면에 보여진 글자들
  const [displayedText, setDisplayedText] = useState('')
  // isTyping: 아직 타이핑 중인지 여부 (커서 깜빡임 제어용)
  const [isTyping, setIsTyping] = useState(false)
  // started: delay 이후 타이핑이 시작되었는지
  const [started, setStarted] = useState(false)

  useEffect(() => {
    // delay밀리초 후에 타이핑 시작
    const startTimer = setTimeout(() => {
      setStarted(true)
      setIsTyping(true)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return

    // text가 변경되면 (언어 전환 시) 즉시 전체 텍스트 표시
    if (displayedText.length > 0 && displayedText !== text.slice(0, displayedText.length)) {
      setDisplayedText(text)
      setIsTyping(false)
      return
    }

    // 아직 다 타이핑되지 않았으면, speed 간격으로 한 글자씩 추가
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    } else {
      // 타이핑 완료
      setIsTyping(false)
    }
  }, [started, displayedText, text, speed])

  return (
    <span className={className}>
      {started ? displayedText : ''}
      {/* 커서 — 타이핑 중에는 항상 보이고, 완료 후에는 깜빡임 */}
      <motion.span
        animate={{ opacity: isTyping ? 1 : [1, 0] }}
        transition={
          isTyping
            ? { duration: 0 }
            : { duration: 0.8, repeat: Infinity, repeatType: 'reverse' }
        }
        className="text-zinc-400"
      >
        |
      </motion.span>
    </span>
  )
}

/**
 * 히어로 섹션 — 사이트 첫 화면
 *
 * 비유: 영화의 오프닝 씬과 같습니다.
 * 첫인상을 결정하는 가장 중요한 부분으로,
 * 대형 타이틀 + 3D 배경으로 강렬한 인상을 줍니다.
 */
export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
      {/* 3D 배경 — Spline 씬 */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Spline scene="https://prod.spline.design/u-jtPTz8mR155px9/scene.splinecode" />
      </div>

      {/* 그라디언트 오버레이 — 3D 위에 텍스트가 잘 보이도록 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* 텍스트 콘텐츠 */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          {/* 배지 — "9th Recruit" (흰색 배경 + 검정 텍스트) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white text-xs font-semibold text-black border border-white">
              {t.hero.badge}
            </span>
          </motion.div>

          {/* 대형 타이틀 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white"
          >
            {t.hero.title}
          </motion.h1>

          {/* 서브타이틀 — 타이핑 애니메이션 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-4 text-sm sm:text-base text-zinc-400 font-light tracking-wide"
          >
            <TypingAnimation
              text={t.hero.subtitle}
              delay={1000}
              speed={40}
            />
          </motion.p>

          {/* 설명 텍스트 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-lg"
          >
            {t.hero.description}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
