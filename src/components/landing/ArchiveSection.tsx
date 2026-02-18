'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { ScrollAnimation } from './ScrollAnimation'

/**
 * Archive 섹션 — 아카이브 티저
 *
 * 비유: 박물관 입구의 안내판과 같습니다.
 * "여기 안에 이런 것들이 있어요"라고 미리 보여주고,
 * "더 보기" 버튼으로 전체 아카이브로 안내합니다.
 *
 * 현재는 별도 페이지가 없으므로 placeholder 상태입니다.
 */
export function ArchiveSection() {
  const { t } = useTranslation()

  return (
    <section id="archive" className="mesa-section py-24 sm:py-32 bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          {/* "Since 2018" 라벨 */}
          <ScrollAnimation>
            <p className="text-sm font-medium tracking-widest uppercase text-zinc-400 mb-4">
              {t.archive.since}
            </p>
          </ScrollAnimation>

          {/* 대형 타이틀 */}
          <ScrollAnimation delay={0.1}>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {t.archive.title}
            </h2>
          </ScrollAnimation>

          {/* 풀네임 */}
          <ScrollAnimation delay={0.2}>
            <p className="mt-4 text-base text-zinc-500">
              {t.archive.subtitle}
            </p>
          </ScrollAnimation>

          {/* 기수 히스토리 */}
          <ScrollAnimation delay={0.3}>
            <p className="mt-6 text-2xl sm:text-3xl font-light text-zinc-400 tracking-wide">
              {t.archive.history}
            </p>
          </ScrollAnimation>

          {/* View More 버튼 */}
          <ScrollAnimation delay={0.4}>
            <button
              className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors group"
              onClick={() => {
                // TODO: 아카이브 페이지로 이동
              }}
            >
              {t.archive.viewMore}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  )
}
