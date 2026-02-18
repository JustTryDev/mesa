'use client'

import { Users, TrendingUp, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { ScrollAnimation } from './ScrollAnimation'
import { SectionTitle } from './SectionTitle'

/**
 * About MESA 섹션
 *
 * 비유: 동아리 소개 팸플릿의 첫 페이지와 같습니다.
 * "우리는 누구인가?" + "우리가 추구하는 3가지 가치"를 보여줍니다.
 */

const valueIcons = [Users, TrendingUp, BookOpen]

export function AboutSection() {
  const { t } = useTranslation()

  return (
    <section id="about" className="mesa-section py-24 sm:py-32 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionTitle title={t.about.title} subtitle={t.about.since} align="center" />

        {/* MESA 풀네임 */}
        <ScrollAnimation delay={0.1} className="mt-8">
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-snug text-center">
            MESA
            <span className="text-zinc-500 dark:text-zinc-400 font-bold">
              (Materials Science & Engineering Study Association)
            </span>
          </p>
        </ScrollAnimation>

        {/* 소개 텍스트 */}
        <ScrollAnimation delay={0.2} className="mt-6 max-w-3xl mx-auto space-y-4">
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
            {t.about.intro}
          </p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
            {t.about.introDetail}
          </p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
            {t.about.history}
          </p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
            {t.about.description}
          </p>
        </ScrollAnimation>

        {/* 핵심 가치 3개 카드 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.about.values.map((value, index) => {
            const Icon = valueIcons[index]
            return (
              <ScrollAnimation key={index} delay={index * 0.15} className="h-full">
                <div
                  className={cn(
                    'group p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 h-full',
                    'transition-all duration-300',
                    'hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-lg hover:-translate-y-1'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    {value.title}
                  </h3>

                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </ScrollAnimation>
            )
          })}
        </div>
      </div>
    </section>
  )
}
