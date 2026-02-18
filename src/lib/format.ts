/**
 * 포맷팅 유틸리티 함수
 *
 * 📌 이 파일의 목적:
 * 프로젝트 전체에서 자주 사용되는 포맷팅 함수들을 한 곳에 모아두어
 * 코드 중복을 방지하고 일관된 포맷팅을 제공합니다.
 *
 * 📌 포함된 함수:
 * - formatTimeAgo: "3분 전", "어제" 같은 상대 시간
 * - formatFileSize: "2.5 MB" 같은 파일 크기
 * - formatPhoneNumber: "010-1234-5678" 같은 전화번호
 * - formatPrice: "1,234,000원" 같은 금액 (단위 포함)
 * - formatAmount: "1,234,567" 같은 금액 (단위 없음, 범용)
 * - formatDateTime: "2025.01.20 14:30" 같은 날짜+시간
 * - formatDateTimeSeconds: "2025.01.20 14:30:45" 같은 날짜+시간+초
 * - formatDateDot: "2025.01.20" 같은 날짜 (점 구분)
 * - formatDateDash: "2025-01-20" 같은 날짜 (대시 구분)
 * - getConfidenceColor: OCR 신뢰도에 따른 색상 클래스
 * - formatConfidence: "95.3%" 같은 OCR 신뢰도 퍼센트
 *
 * 📌 사용 예시:
 * import { formatTimeAgo, formatFileSize, formatAmount } from "@/lib/format"
 *
 * const timeText = formatTimeAgo(message.createdAt)  // "3분 전"
 * const sizeText = formatFileSize(file.size)          // "2.5 MB"
 * const amountText = formatAmount(1234567)            // "1,234,567"
 */

import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

// ==================== 시간 포맷팅 ====================

/**
 * 타임스탬프를 상대 시간 문자열로 변환
 *
 * @param timestamp - 밀리초 타임스탬프 또는 Date 객체
 * @returns "방금 전", "3분 전", "2시간 전", "어제", "3일 전" 등
 *
 * @example
 * formatTimeAgo(Date.now() - 1000 * 60 * 3) // "3분 전"
 * formatTimeAgo(new Date("2025-01-18"))     // "2일 전"
 *
 * 📌 일상생활 비유:
 * 카카오톡에서 메시지 옆에 "3분 전"이라고 표시되는 것처럼,
 * 정확한 시간 대신 "얼마나 지났는지"를 보여줍니다.
 */
export function formatTimeAgo(timestamp: number | Date): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp

  return formatDistanceToNow(date, {
    addSuffix: true, // "전" 또는 "후" 접미사 추가
    locale: ko, // 한국어로 표시
  })
}

// ==================== 파일 크기 포맷팅 ====================

/**
 * 바이트 수를 사람이 읽기 쉬운 단위로 변환
 *
 * @param bytes - 바이트 수
 * @returns "500 B", "1.2 KB", "3.5 MB", "2.1 GB" 등
 *
 * @example
 * formatFileSize(500)         // "500 B"
 * formatFileSize(1536)        // "1.5 KB"
 * formatFileSize(2621440)     // "2.5 MB"
 *
 * 📌 일상생활 비유:
 * 파일 크기가 "2621440 바이트"라고 하면 어려운데,
 * "2.5 MB"라고 하면 바로 이해되죠? 이 함수가 그 변환을 해줍니다.
 */
export function formatFileSize(bytes: number | undefined): string {
  // 값이 없으면 빈 문자열 반환
  if (!bytes || bytes === 0) return ""

  // 📌 단위 기준
  // B (바이트) → KB (킬로바이트, 1024 B) → MB (메가바이트, 1024 KB) → GB (기가바이트, 1024 MB)
  const KB = 1024
  const MB = KB * 1024
  const GB = MB * 1024

  // 📌 크기에 따라 적절한 단위 선택
  if (bytes < KB) {
    return `${bytes} B`
  }
  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`
  }
  if (bytes < GB) {
    return `${(bytes / MB).toFixed(1)} MB`
  }
  return `${(bytes / GB).toFixed(1)} GB`
}

// ==================== 전화번호 포맷팅 ====================

/**
 * 전화번호에 하이픈(-) 추가
 *
 * @param phone - 숫자만 있는 전화번호 (예: "01012345678")
 * @returns 하이픈이 포함된 전화번호 (예: "010-1234-5678")
 *
 * @example
 * formatPhoneNumber("01012345678")  // "010-1234-5678"
 * formatPhoneNumber("0212345678")   // "02-1234-5678"
 * formatPhoneNumber("0311234567")   // "031-123-4567"
 *
 * 📌 일상생활 비유:
 * "01012345678"보다 "010-1234-5678"이 읽기 쉽죠?
 * 이 함수는 전화번호를 보기 좋게 정리해줍니다.
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출 (하이픈, 공백 등 제거)
  const cleaned = phone.replace(/\D/g, "")

  // 📌 휴대폰 번호 (010, 011, 016, 017, 018, 019)
  if (cleaned.startsWith("01")) {
    // 010-1234-5678 형식
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
  }

  // 📌 기업 대표번호 (1566, 1588, 1666, 1899 등) - 8자리
  // 일상생활 비유: "1666-1725"처럼 고객센터 전화번호를 포맷팅
  if (/^1[568]\d{6}$/.test(cleaned)) {
    return cleaned.replace(/(\d{4})(\d{4})/, "$1-$2")
  }

  // 📌 서울 지역번호 (02)
  if (cleaned.startsWith("02")) {
    if (cleaned.length === 9) {
      // 02-123-4567 형식
      return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3")
    }
    // 02-1234-5678 형식
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3")
  }

  // 📌 기타 지역번호 (031, 032, ...)
  if (cleaned.length === 10) {
    // 031-123-4567 형식
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
  }

  // 031-1234-5678 형식
  return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
}

// ==================== 금액 포맷팅 ====================

/**
 * 숫자를 한국 원화 형식으로 변환
 *
 * @param amount - 금액 (숫자)
 * @param options - 옵션
 * @param options.showUnit - "원" 단위 표시 여부 (기본: true)
 * @returns "1,234,000원" 또는 "1,234,000" 형식
 *
 * @example
 * formatPrice(1234000)                    // "1,234,000원"
 * formatPrice(1234000, { showUnit: false }) // "1,234,000"
 *
 * 📌 일상생활 비유:
 * "1234000"보다 "1,234,000원"이 훨씬 읽기 쉽죠?
 * 천 단위마다 콤마를 찍어줍니다.
 */
export function formatPrice(amount: number, options: { showUnit?: boolean } = {}): string {
  const { showUnit = true } = options

  // 📌 천 단위 콤마 추가
  const formatted = amount.toLocaleString("ko-KR")

  return showUnit ? `${formatted}원` : formatted
}

// ==================== 날짜+시간 포맷팅 ====================

/**
 * ISO 문자열 또는 Date를 "YYYY.MM.DD HH:mm" 형식으로 변환
 *
 * @param dateStr - ISO 문자열, Date 객체, 또는 null/undefined
 * @returns "2025.01.20 14:30" 형식의 문자열, 값이 없으면 "-"
 *
 * @example
 * formatDateTime("2025-01-20T14:30:00Z") // "2025.01.20 23:30" (KST)
 * formatDateTime(new Date())              // "2025.01.20 14:30"
 * formatDateTime(null)                    // "-"
 *
 * 📌 일상생활 비유:
 * 카톡에서 "오후 2:30"처럼 시간을 보여주는 것과 비슷합니다.
 * 날짜 + 시(時) + 분(分)까지 보여줍니다.
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-'
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return '-'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

/**
 * ISO 문자열 또는 Date를 "YYYY.MM.DD HH:mm:ss" 형식으로 변환
 *
 * @param dateStr - ISO 문자열, Date 객체, 또는 null/undefined
 * @returns "2025.01.20 14:30:45" 형식의 문자열, 값이 없으면 "-"
 *
 * @example
 * formatDateTimeSeconds("2025-01-20T14:30:45Z") // "2025.01.20 23:30:45" (KST)
 * formatDateTimeSeconds(null)                    // "-"
 *
 * 📌 일상생활 비유:
 * formatDateTime은 "분"까지만 보여주지만,
 * 이 함수는 "초"까지 보여줍니다. 로그 기록처럼 정밀한 시간이 필요할 때 사용합니다.
 */
export function formatDateTimeSeconds(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-'
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return '-'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
}

// ==================== 금액 포맷팅 (범용) ====================

/**
 * 숫자를 한국식 콤마 포맷으로 변환 (통화 단위 없이)
 *
 * @param value - 금액 (숫자, 문자열, null, undefined)
 * @returns "1,234,567" 형식의 문자열, 값이 없으면 "0"
 *
 * @example
 * formatAmount(1234567)   // "1,234,567"
 * formatAmount("1234567") // "1,234,567"
 * formatAmount(null)      // "0"
 * formatAmount(0)         // "0"
 *
 * 📌 일상생활 비유:
 * formatPrice는 "1,234,000원"처럼 "원" 단위가 붙지만,
 * formatAmount는 순수하게 콤마만 찍어줍니다.
 * 엑셀에서 셀 서식을 "숫자(콤마)"로 지정하는 것과 같습니다.
 *
 * 📌 formatPrice와의 차이:
 * - formatPrice(1234000) → "1,234,000원" (단위 포함, number만 받음)
 * - formatAmount(1234000) → "1,234,000" (단위 없음, string/null도 받음)
 */
export function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toLocaleString('ko-KR')
}

// ==================== 날짜 포맷팅 (날짜만) ====================

/**
 * Date 객체 또는 타임스탬프를 "YYYY.MM.DD" 형식으로 변환
 *
 * @param date - Date 객체 또는 밀리초 타임스탬프
 * @returns "2025.01.20" 형식의 문자열
 *
 * @example
 * formatDateDot(new Date())     // "2025.01.20"
 * formatDateDot(1705708800000)  // "2025.01.20"
 */
export function formatDateDot(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}.${month}.${day}`
}

/**
 * Date 객체 또는 타임스탬프를 "YYYY-MM-DD" 형식으로 변환
 *
 * @param date - Date 객체 또는 밀리초 타임스탬프
 * @returns "2025-01-20" 형식의 문자열
 *
 * @example
 * formatDateDash(new Date())     // "2025-01-20"
 * formatDateDash(1705708800000)  // "2025-01-20"
 */
export function formatDateDash(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// ==================== OCR 신뢰도 포맷팅 ====================

/**
 * OCR 인식 신뢰도 점수에 따른 Tailwind 텍스트 색상 클래스 반환
 *
 * @param score - 0~1 사이의 신뢰도 점수, 또는 null
 * @returns Tailwind CSS 텍스트 색상 클래스
 *
 * @example
 * getConfidenceColor(0.97) // "text-green-600" (높은 신뢰도)
 * getConfidenceColor(0.85) // "text-yellow-600" (보통 신뢰도)
 * getConfidenceColor(0.5)  // "text-red-600" (낮은 신뢰도)
 * getConfidenceColor(null) // "text-gray-400" (값 없음)
 *
 * 📌 일상생활 비유:
 * 시험 점수에 따라 "잘했어요(초록)", "조금 아쉬워요(노랑)", "다시 확인해주세요(빨강)"
 * 처럼 색깔로 결과를 알려주는 것과 같습니다.
 */
export function getConfidenceColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 0.95) return 'text-green-600'
  if (score >= 0.8) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * OCR 인식 신뢰도 점수를 퍼센트 문자열로 변환
 *
 * @param score - 0~1 사이의 신뢰도 점수, 또는 null
 * @returns "95.3%" 형식의 문자열, 값이 없으면 "-"
 *
 * @example
 * formatConfidence(0.953) // "95.3%"
 * formatConfidence(0.8)   // "80.0%"
 * formatConfidence(null)  // "-"
 *
 * 📌 일상생활 비유:
 * OCR이 글자를 읽은 뒤 "이 결과가 맞을 확률이 95.3%야"라고 알려주는 것입니다.
 * 0.953이라는 소수점을 사람이 읽기 쉬운 "95.3%"로 바꿔줍니다.
 */
export function formatConfidence(score: number | null): string {
  if (score === null) return '-'
  return `${(score * 100).toFixed(1)}%`
}
