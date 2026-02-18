/**
 * 공용 유효성 검증 함수
 * - 프로젝트 전체에서 동일한 검증 로직을 사용하기 위한 중앙 관리 모듈
 * - 각 파일에서 직접 정규식을 작성하지 않고, 이 함수를 import해서 사용
 */

/** 이메일 검증 정규식 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 이메일 주소가 유효한지 검증
 * - 앞뒤 공백을 자동으로 제거한 후 검사
 * - 예: "user@example.com" → true, "invalid" → false
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}
