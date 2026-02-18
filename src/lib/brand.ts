/**
 * 브랜드 컬러 및 스타일 상수
 *
 * TODO: 프로젝트에 맞게 색상을 변경하세요.
 * globals.css의 CSS 변수와 동기화되어 있습니다.
 */

export const BRAND_COLORS = {
  // 메인 컬러 (Primary - Blue)
  primary: "#3b82f6",
  primaryLight: "#60a5fa",
  primaryDark: "#2563eb",

  // 서브 컬러 (Secondary - Dark Blue)
  secondary: "#1e3a5f",
  secondaryLight: "#2d4a73",
  secondaryDark: "#152d4a",

  // 텍스트 컬러
  text: {
    primary: "#191F28",
    secondary: "#4E5968",
    tertiary: "#8B95A1",
    white: "#FFFFFF",
  },

  // 배경 컬러
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F2F4F6",
    dark: "#0a0a0a",
  },

  // 보더 컬러
  border: "#E5E8EB",
} as const

export type BrandColors = typeof BRAND_COLORS

// 공통 스타일 헬퍼
export const brandStyles = {
  primaryGradient: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 50%, ${BRAND_COLORS.primary} 100%)`,
  shadowPrimary: `0 8px 24px rgba(59, 130, 246, 0.35)`,
  shadowSecondary: `0 4px 12px rgba(30, 58, 95, 0.3)`,
  shadowCard: `0 2px 12px rgba(0,0,0,0.08)`,
  shadowCardHover: `0 8px 24px rgba(0,0,0,0.12)`,
} as const
