/**
 * MESA 웹사이트 관련 타입 정의
 *
 * 비유: 레고 설명서에서 "이 블록은 이런 모양이야"라고 정의하는 것처럼,
 * TypeScript 타입은 "이 데이터는 이런 구조야"라고 미리 약속하는 것입니다.
 * 약속과 다른 데이터를 넣으면 에러가 나서, 실수를 사전에 방지합니다.
 */

import type { LucideIcon } from 'lucide-react'

/** 상단 네비게이션 메뉴 아이템 */
export interface NavItem {
  /** 메뉴에 표시될 텍스트 (예: "About") */
  label: string
  /** 이동할 경로 — 앵커(#about) 또는 페이지(/about) */
  href: string
  /** 스크롤 대상 섹션의 HTML id */
  sectionId?: string
}

/** 핵심 가치 카드 데이터 */
export interface ValueCardData {
  /** Lucide 아이콘 컴포넌트 */
  icon: LucideIcon
  /** 카드 제목 */
  title: string
  /** 카드 설명 */
  description: string
}

/** 프로그램(활동) 데이터 */
export interface ProgramData {
  /** 필수/추가 활동 분류 */
  category: 'essential' | 'additional'
  /** 프로그램 제목 */
  title: string
  /** 프로그램 설명 */
  description: string
  /** Lucide 아이콘 컴포넌트 */
  icon: LucideIcon
  /** 일정 (예: "매주 수요일") */
  schedule?: string
}

/** 회장단 데이터 */
export interface LeaderData {
  /** 이름 */
  name: string
  /** 직책 (예: "회장", "남자 부회장") */
  role: string
  /** 학번 (예: "22학번") */
  year: string
  /** 학과 */
  department: string
  /** 프로필 이미지 URL — 없으면 placeholder 표시 */
  imageUrl?: string
}

/** SNS 링크 데이터 */
export interface SnsLinkData {
  /** 플랫폼 구분 */
  platform: 'instagram' | 'naver-cafe' | 'youtube' | 'email'
  /** 표시 이름 */
  label: string
  /** 링크 URL */
  url: string
}

/** MESA 기본 정보 */
export interface MesaInfo {
  /** 현재 기수 */
  currentGeneration: number
  /** 설립 연도 */
  foundedYear: number
  /** 대표 이메일 */
  email: string
  /** 영문 풀네임 */
  fullName: string
  /** 대학교명 */
  university: string
  /** 학부명 */
  department: string
}
