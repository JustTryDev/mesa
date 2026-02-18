'use client'

import { User } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { ScrollAnimation } from './ScrollAnimation'
import { SectionTitle } from './SectionTitle'

/**
 * 9기 회장단 소개 섹션
 *
 * 비유: 학교 학생회 게시판에 붙어 있는 "회장단 소개" 포스터와 같습니다.
 * 각 회장단의 원형 프로필 사진, 이름, 직책, 학번을 보여줍니다.
 */
export function LeadershipSection() {
  const { t } = useTranslation()

  return (
    <section id="notice" className="mesa-section py-24 sm:py-32 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 섹션 제목 */}
        <SectionTitle title={t.leadership.title} subtitle={t.leadership.label} align="center" />

        {/* 회장단 카드 그리드 */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {t.leadership.leaders.map((leader, index) => (
            <ScrollAnimation key={index} delay={index * 0.1}>
              <div
                className={cn(
                  'group text-center',
                  'transition-all duration-300',
                  'hover:-translate-y-1'
                )}
              >
                {/* 원형 프로필 사진 */}
                <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5 overflow-hidden group-hover:shadow-lg transition-all duration-300">
                  {'imageUrl' in leader && leader.imageUrl ? (
                    <Image
                      src={leader.imageUrl}
                      alt={leader.name}
                      width={144}
                      height={144}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <User className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                  )}
                </div>

                {/* 직책 */}
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  {leader.role}
                </p>

                {/* 이름 */}
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {leader.name}
                </h4>

                {/* 학번 + 학과 */}
                <p className="mt-1 text-sm text-zinc-500">
                  {leader.year}
                </p>
                <p className="text-xs text-zinc-400">
                  {leader.department}
                </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}
