'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, Layers } from 'lucide-react'
import Link from 'next/link'

/**
 * 랜딩 페이지 (샘플)
 *
 * TODO: 프로젝트에 맞게 내용을 수정하세요.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero 섹션 */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Next.js Admin
            <br />
            <span className="text-[var(--color-primary)]">Starter Kit</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-gray-600"
          >
            VS Code 스타일 멀티탭 어드민, Supabase 인증, 30개+ 커스텀 훅이
            포함된 풀스택 스타터킷으로 빠르게 시작하세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Link
              href="/admin/dashboard"
              className="btn-animated rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2"
            >
              어드민 패널 열기
              <ArrowRight className="w-4 h-4 btn-arrow" />
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-[var(--color-primary)] transition-colors"
            >
              로그인 <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features 섹션 */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              포함된 기능
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              프로덕션 레벨의 기능이 이미 구현되어 있습니다.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl grid grid-cols-1 gap-8 sm:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="service-card-enhanced relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="service-icon-enhanced w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-24">
        <div className="mx-auto max-w-2xl text-center px-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            지금 시작하세요
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            CSS 변수 1개만 바꾸면 전체 브랜드 색상이 변경됩니다.
          </p>
          <div className="mt-8">
            <Link
              href="/admin/dashboard"
              className="btn-primary-enhanced inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-base font-semibold text-white shadow-lg"
            >
              어드민 대시보드로 이동
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const features = [
  {
    title: 'VS Code 스타일 어드민',
    description:
      '멀티탭, 듀얼 패널, 드래그앤드롭 사이드바, iframe 상태 보존 등 VS Code 수준의 어드민 패널을 제공합니다.',
    icon: Layers,
  },
  {
    title: 'Supabase 인증 + 권한',
    description:
      '직원/고객 이중 인증, super_admin/admin/staff 3단계 권한, 메뉴별 세부 접근 제어가 내장되어 있습니다.',
    icon: Shield,
  },
  {
    title: '30개+ 커스텀 훅',
    description:
      'useDebounce, useTableSettings, useBulkSelection 등 검증된 커스텀 훅과 45개+ UI 컴포넌트가 포함됩니다.',
    icon: Zap,
  },
]
