/**
 * Supabase 에러 처리 헬퍼
 * AbortError 감지 및 처리를 위한 유틸리티
 */

/**
 * AbortError인지 확인하는 함수
 * 컴포넌트 언마운트, 요청 취소 등으로 발생하는 에러를 감지
 */
export function isAbortError(error: unknown): boolean {
  // DOMException 타입 체크 (브라우저 환경)
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'AbortError') return true
  }

  if (error instanceof Error) {
    // Error.name 체크
    if (error.name === 'AbortError') return true

    // 메시지 기반 감지 (Supabase 내부 에러 포함)
    const message = error.message?.toLowerCase() || ''
    if (
      message.includes('abort') ||
      message.includes('cancelled') ||
      message.includes('canceled') ||
      message.includes('signal is aborted') ||
      message.includes('the operation was aborted')
    ) {
      return true
    }
  }

  // Supabase/일반 에러 객체
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>

    // 에러 코드 체크
    if (
      errObj.code === 'ABORT_ERR' ||
      errObj.code === '20' ||
      errObj.code === 'ERR_CANCELED'
    ) {
      return true
    }

    // name 속성 체크
    if (errObj.name === 'AbortError') return true

    // 메시지 속성 체크
    const objMessage = (errObj.message as string)?.toLowerCase() || ''
    if (
      objMessage.includes('abort') ||
      objMessage.includes('signal is aborted')
    ) {
      return true
    }
  }

  return false
}

/**
 * 안전하게 에러 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '알 수 없는 오류가 발생했습니다.'
}
