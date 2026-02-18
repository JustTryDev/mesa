'use client'

import {
  Calendar,
  BookMarked,
  PenTool,
  FolderKanban,
  FileText,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { ScrollAnimation } from './ScrollAnimation'
import { SectionTitle } from './SectionTitle'

/**
 * Programs (Activities) 섹션
 *
 * 비유: 동아리 활동 안내 브로셔와 같습니다.
 * "우리 동아리에 들어오면 이런 활동들을 해요"를 보여줍니다.
 *
 * 배경에 강의실 사진 + 검정 반투명 오버레이를 사용합니다.
 * 이렇게 하면 사진이 은은하게 비치면서도 텍스트가 잘 보입니다.
 */

/** 프로그램별 아이콘 매핑 — 번역 데이터 순서와 동일 */
const programIcons: LucideIcon[] = [
  Calendar,
  BookMarked,
  PenTool,
  FolderKanban,
  FileText,
  Sparkles,
]

export function ProgramsSection() {
  const { t } = useTranslation()

  // Essential(0~3)과 Additional(4~5)로 분리
  const essentialPrograms = t.programs.items.slice(0, 4)
  const additionalPrograms = t.programs.items.slice(4)

  return (
    <section id="programs" className="mesa-section relative py-24 sm:py-32 overflow-hidden">
      {/* 배경 이미지 — 강의실 사진 */}
      <Image
        src="/image/background.jpg"
        alt=""
        fill
        className="object-cover"
        quality={60}
        loading="lazy"
      />
      {/* 검정 반투명 오버레이 — 배경 사진이 은은하게 보이면서 텍스트도 잘 읽히는 수준 */}
      <div className="absolute inset-0 bg-black/90" />

      {/* 콘텐츠 — relative z-10으로 오버레이 위에 표시 */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* 섹션 제목 — 다크 배경이므로 light 모드 */}
        <SectionTitle
          title={t.programs.title}
          subtitle={t.programs.label}
          light
        />

        {/* Essential Activities */}
        <div className="mt-16">
          <ScrollAnimation>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8">
              {t.programs.essential}
            </h3>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {essentialPrograms.map((program, index) => {
              const Icon = programIcons[index]
              return (
                <ScrollAnimation key={index} delay={index * 0.1} className="h-full">
                  <div
                    className={cn(
                      'group p-6 rounded-2xl h-full',
                      'bg-white/[0.03] border border-white/[0.06]',
                      'hover:bg-white/[0.06] hover:border-white/[0.1]',
                      'transition-all duration-300'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* 아이콘 */}
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-zinc-400" />
                      </div>

                      <div className="min-w-0">
                        {/* 제목 + 일정 */}
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-white">
                            {program.title}
                          </h4>
                          {'schedule' in program && program.schedule && (
                            <span className="text-xs text-zinc-500 bg-white/[0.06] px-2 py-0.5 rounded-full">
                              {program.schedule}
                            </span>
                          )}
                        </div>

                        {/* 설명 */}
                        <p className="text-sm text-zinc-500 leading-relaxed">
                          {program.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              )
            })}
          </div>
        </div>

        {/* Additional Activities */}
        <div className="mt-12">
          <ScrollAnimation>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8">
              {t.programs.additional}
            </h3>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalPrograms.map((program, index) => {
              const Icon = programIcons[index + 4]
              return (
                <ScrollAnimation key={index} delay={index * 0.1} className="h-full">
                  <div
                    className={cn(
                      'group p-6 rounded-2xl h-full',
                      'bg-white/[0.03] border border-white/[0.06]',
                      'hover:bg-white/[0.06] hover:border-white/[0.1]',
                      'transition-all duration-300'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-white mb-2">
                          {program.title}
                        </h4>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                          {program.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
