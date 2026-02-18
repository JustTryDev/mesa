'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * 스크롤 애니메이션 래퍼 컴포넌트
 *
 * 비유: 무대 위의 배우가 커튼이 올라가면(화면에 보이면) 연기를 시작하는 것처럼,
 * 이 컴포넌트로 감싸진 요소는 스크롤로 화면에 나타날 때 애니메이션이 시작됩니다.
 *
 * 왜 이걸 별도 컴포넌트로 만들었나요?
 * → 여러 섹션에서 같은 애니메이션을 반복 작성하는 대신,
 *   이 래퍼 하나로 감싸면 됩니다. 코드 중복을 줄이는 "재사용 블록"입니다.
 *
 * @example
 * <ScrollAnimation direction="up" delay={0.2}>
 *   <h2>이 제목은 아래에서 위로 나타납니다</h2>
 * </ScrollAnimation>
 */
interface ScrollAnimationProps {
  children: ReactNode
  /** 어디서 나타나는지 (기본: 아래에서 위로) */
  direction?: 'up' | 'down' | 'left' | 'right'
  /** 시작 지연 시간 (초) */
  delay?: number
  /** 애니메이션 지속 시간 (초) */
  duration?: number
  /** 추가 CSS 클래스 */
  className?: string
}

export function ScrollAnimation({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
}: ScrollAnimationProps) {
  // 방향에 따른 시작 위치 — "어디에서 날아오는지" 결정
  const offsets = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  }

  return (
    <motion.div
      // initial: 처음 상태 (안 보이고, 살짝 밀려있음)
      initial={{ opacity: 0, ...offsets[direction] }}
      // whileInView: 화면에 보일 때 (완전히 보이고, 제자리로)
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      // viewport: 한 번만 실행 (once: true), 80px 전에 미리 시작
      viewport={{ once: true, margin: '-80px' }}
      // transition: 부드러운 커브 (토스 스타일)
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
