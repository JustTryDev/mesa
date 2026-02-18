import { BRAND_COLORS } from '@/lib/brand'
import type { SectionHeaderProps } from '@/types/home'

/**
 * SectionHeader Component
 *
 * 홈페이지 각 섹션에서 반복되는 헤더 패턴을 추상화한 컴포넌트입니다.
 * - 라벨 배지 (선택)
 * - 타이틀 (필수)
 * - 설명 텍스트 (선택, 단일/복수 줄 지원)
 *
 * @example
 * // 기본 사용
 * <SectionHeader
 *   label="PORTFOLIO"
 *   title="수많은 제작 사례가 실력을 증명합니다"
 *   description="개인의 작품부터 대형 프로젝트까지"
 * />
 *
 * @example
 * // JSX 타이틀 + 복수 설명
 * <SectionHeader
 *   label="CERTIFIED"
 *   title={<>신뢰를 <span style={{ color: '#1a2867' }}>인증</span>으로 증명합니다</>}
 *   description={["국내외 공인 인증을 통해 품질과 안전을 보장합니다.", "쿠디솜은 검증된 파트너와 함께합니다."]}
 * />
 */
export default function SectionHeader({
  label,
  title,
  description,
  centered = true,
  className,
  titleMarginBottom = 24,
  descriptionMarginBottom = 0,
}: SectionHeaderProps) {
  // 설명 텍스트 배열 정규화
  const descriptionLines = description
    ? Array.isArray(description)
      ? description
      : [description]
    : []

  return (
    <div style={centered ? styles.headerCentered : styles.headerLeft} className={className}>
      {/* 라벨 배지 */}
      {label && (
        <div style={styles.labelBadge}>
          <span style={styles.labelText}>{label}</span>
        </div>
      )}

      {/* 타이틀 */}
      <h2 style={{ ...styles.title, marginBottom: titleMarginBottom }}>{title}</h2>

      {/* 설명 텍스트 */}
      {descriptionLines.length > 0 && (
        <div style={{ marginBottom: descriptionMarginBottom }}>
          {descriptionLines.length === 1 ? (
            // 단일 줄: line-height 2 적용
            <p style={styles.description}>{descriptionLines[0]}</p>
          ) : (
            // 복수 줄: 각 줄별 렌더링
            descriptionLines.map((line, index) => (
              <p key={index} style={styles.descriptionLine}>
                {line}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  headerCentered: {
    textAlign: 'center',
    marginBottom: '56px',
  },
  headerLeft: {
    textAlign: 'left',
    marginBottom: '56px',
  },
  labelBadge: {
    display: 'inline-flex',
    padding: '8px 16px',
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: '100px',
    marginBottom: '24px',
  },
  labelText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '1px',
  },
  title: {
    fontSize: 'clamp(24px, 4vw, 38px)',
    fontWeight: 700,
    color: BRAND_COLORS.text.primary,
    lineHeight: 1.4,
  },
  description: {
    fontSize: 'clamp(14px, 1.5vw, 16px)',
    color: BRAND_COLORS.text.tertiary,
    lineHeight: 2,
    margin: 0,
  },
  descriptionLine: {
    fontSize: 'clamp(14px, 1.5vw, 16px)',
    color: BRAND_COLORS.text.tertiary,
    margin: '0 0 12px 0',
    lineHeight: 1.6,
  },
}
