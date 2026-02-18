/**
 * MESA 상수 데이터
 *
 * 비유: 학교 게시판에 붙이는 "동아리 정보 포스터"에 적힌 내용을
 * 한 곳에 모아둔 파일입니다. 내년에 10기가 되면 이 파일만 수정하면 됩니다.
 *
 * 왜 이렇게 분리하나요?
 * → 코드(디자인/레이아웃)와 데이터(텍스트/정보)를 분리하면,
 *   디자인을 바꾸지 않고도 내용만 쉽게 수정할 수 있습니다.
 */

import {
  Users,
  TrendingUp,
  BookOpen,
  Calendar,
  BookMarked,
  PenTool,
  FolderKanban,
  FileText,
  Sparkles,
} from 'lucide-react'
import type {
  NavItem,
  ValueCardData,
  ProgramData,
  LeaderData,
  SnsLinkData,
  MesaInfo,
} from '@/types/mesa'

/** 네비게이션 메뉴 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'About', href: '#about', sectionId: 'about' },
  { label: 'Activities', href: '#programs', sectionId: 'programs' },
  { label: 'Archive', href: '#archive', sectionId: 'archive' },
  { label: 'Notice', href: '#notice', sectionId: 'notice' },
]

/** SNS 링크 */
export const SNS_LINKS: SnsLinkData[] = [
  {
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/hyu_mesa',
  },
  {
    platform: 'naver-cafe',
    label: 'Naver Cafe',
    url: 'https://cafe.naver.com/hyumesa',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com',
  },
]

/** 핵심 가치 3가지 */
export const VALUE_CARDS: ValueCardData[] = [
  {
    icon: Users,
    title: '혼자가 아닌, 함께 고민하는 구조',
    description:
      '진로가 명확하지 않거나 전공 공부가 막막한 단계에서 비슷한 고민을 가진 사람들과 고민을 공유하고 함께 커리어 방향을 그려가는 네트워크를 만듭니다.',
  },
  {
    icon: TrendingUp,
    title: '경험이 이어지는 성장 구조',
    description:
      '단순 스터디에서 끝나지 않고, 부원들과 선후배 간 연결을 통해 경험을 공유하고 진로를 탐색합니다. 학술 스터디 및 칼럼을 통해 양질의 정보를 공유하여 함께 성장하는 구조를 만듭니다.',
  },
  {
    icon: BookOpen,
    title: '학문적 이해를 산업과 연구로',
    description:
      '전공 과목에 대한 심도 깊은 이해를 통해 전공이 어떻게 산업과 연결되고 연구에서 적용되는지를 탐색합니다. 학문적 기반을 다져 전공이 다양한 진로로 확장되는 흐름을 이해합니다.',
  },
]

/** MESA 9기 프로그램 */
export const PROGRAMS: ProgramData[] = [
  // Essential Activities
  {
    category: 'essential',
    title: '정기회합',
    description:
      '매주 수요일 저녁, 모든 부원이 함께 모여 전공과 진로에 대한 시야를 넓히는 시간을 가집니다. 학술특강, 미니컨퍼런스, 학술발표 등 진로 탐색 및 활동 공유의 장이 됩니다.',
    icon: Calendar,
    schedule: '매주 수요일',
  },
  {
    category: 'essential',
    title: '정기 팀 학술 스터디',
    description:
      '관심 분야를 고려하여 팀을 편성해 개인 학술 칼럼 및 팀 프로젝트를 위한 학술 스터디를 진행합니다.',
    icon: BookMarked,
  },
  {
    category: 'essential',
    title: 'MESA 인사이트 칼럼',
    description:
      '팀 정기 학술 스터디를 통해 습득한 지식과 자료를 바탕으로, 본인이 탐구하고 싶은 세부 주제를 정해 비전공자도 이해할 수 있도록 정리하고 개인의 이해, 해석과 진로탐색 인사이트를 담은 글을 작성합니다.',
    icon: PenTool,
  },
  {
    category: 'essential',
    title: '팀 학술 프로젝트',
    description:
      '정기 팀 학술 스터디 팀원들과 함께 한학기마다 공동 학술 프로젝트 활동을 수행합니다.',
    icon: FolderKanban,
  },
  // Additional Activities
  {
    category: 'additional',
    title: 'MESA 학술지 제작',
    description:
      '1년간의 학술 활동을 아카이브하는 학술지를 만듭니다. 학술지는 전원 강제가 아닌 선별·큐레이션 방식으로 제작되며, MESA의 고유 자산으로 남게됩니다.',
    icon: FileText,
  },
  {
    category: 'additional',
    title: '기타 활동',
    description:
      '전공 그룹 스터디, 메라클 모닝/나잇, 진로 세미나, 박람회 단체관람, 네트워킹, MESA 워크숍, 홈커밍데이 등 다양한 학습 습관 향상 및 진로탐색, 친목을 다지는 활동들을 자유롭게 참여할 수 있습니다.',
    icon: Sparkles,
  },
]

/** 9기 회장단 */
export const LEADERS: LeaderData[] = [
  {
    name: '이준서',
    role: '회장',
    year: '22학번',
    department: '신소재공학과',
  },
  {
    name: '김헌종',
    role: '남자 부회장',
    year: '22학번',
    department: '신소재공학과',
  },
  {
    name: '심은서',
    role: '여자 부회장',
    year: '24학번',
    department: '신소재공학과',
  },
  {
    name: '김도관',
    role: '총무',
    year: '22학번',
    department: '신소재공학과',
  },
]

/** MESA 기본 정보 */
export const MESA_INFO: MesaInfo = {
  currentGeneration: 9,
  foundedYear: 2018,
  email: 'hyumesa9@gmail.com',
  fullName: 'Materials Science & Engineering Study Association',
  university: '한양대학교',
  department: '신소재공학부',
}
