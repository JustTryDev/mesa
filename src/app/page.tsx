/**
 * MESA 메인 랜딩 페이지
 *
 * 비유: 책의 목차와 같습니다.
 * 각 섹션(챕터)을 위에서 아래로 순서대로 조립합니다.
 * 개별 섹션의 내용은 각 컴포넌트 파일에 있고,
 * 이 파일은 "어떤 순서로 보여줄지"만 결정합니다.
 *
 * 왜 이렇게 깔끔하게 분리하나요?
 * → HeroSection만 수정하고 싶으면 HeroSection.tsx만 열면 됩니다.
 *   전체 코드를 뒤질 필요 없이, 원하는 부분만 빠르게 찾을 수 있습니다.
 */

import { Header } from '@/components/landing/Header'
import { HeroSection } from '@/components/landing/HeroSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { ProgramsSection } from '@/components/landing/ProgramsSection'
import { ArchiveSection } from '@/components/landing/ArchiveSection'
import { LeadershipSection } from '@/components/landing/LeadershipSection'
import { Footer } from '@/components/landing/Footer'
import { ChatBot } from '@/components/landing/ChatBot'

export default function HomePage() {
  return (
    <>
      {/* 고정 헤더 (항상 상단에 떠있음) */}
      <Header />

      <main>
        {/* 1. 히어로 — Spline 3D 배경 + MESA 대형 타이틀 */}
        <HeroSection />

        {/* 2. About — MESA 소개 + 핵심 가치 3가지 */}
        <AboutSection />

        {/* 3. Programs — 정기활동 + 추가활동 */}
        <ProgramsSection />

        {/* 4. Archive — 아카이브 티저 + View More */}
        <ArchiveSection />

        {/* 5. Leadership — 9기 회장단 (증명사진 placeholder) */}
        <LeadershipSection />
      </main>

      {/* 푸터 — 연락처 + SNS + 저작권 */}
      <Footer />

      {/* 챗봇 플로팅 배너 — 우측 하단 */}
      <ChatBot />
    </>
  )
}
