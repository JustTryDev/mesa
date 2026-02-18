import { cn } from '@/lib/utils'
import { ScrollAnimation } from './ScrollAnimation'

/**
 * 섹션 제목 공통 컴포넌트
 *
 * 비유: 책의 챕터 제목 스타일을 통일하는 것과 같습니다.
 * 모든 섹션에서 같은 크기, 같은 간격의 제목을 사용하면
 * 사이트 전체가 일관되게 보입니다.
 *
 * @example
 * <SectionTitle title="About MESA" subtitle="Since 2018" />
 * <SectionTitle title="Programs" light />  // 다크 배경에서 사용
 */
interface SectionTitleProps {
  /** 메인 제목 */
  title: string
  /** 보조 텍스트 (선택) */
  subtitle?: string
  /** 정렬 방향 */
  align?: 'left' | 'center'
  /** 다크 배경에서 밝은 텍스트 사용 */
  light?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

export function SectionTitle({
  title,
  subtitle,
  align = 'left',
  light = false,
  className,
}: SectionTitleProps) {
  return (
    <ScrollAnimation className={cn(align === 'center' && 'text-center', className)}>
      {/* 서브타이틀: 작은 글씨로 위에 표시 */}
      {subtitle && (
        <p
          className={cn(
            'text-sm font-medium tracking-widest uppercase mb-4',
            light ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
          )}
        >
          {subtitle}
        </p>
      )}
      {/* 메인 제목: 크고 굵게 */}
      <h2
        className={cn(
          'text-3xl sm:text-4xl font-bold tracking-tight',
          light ? 'text-white' : 'text-zinc-900 dark:text-white'
        )}
      >
        {title}
      </h2>
    </ScrollAnimation>
  )
}
