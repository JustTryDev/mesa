/**
 * API 응답 헬퍼 함수
 *
 * 비유: 편의점에서 "감사합니다" 멘트가 통일되어 있듯이,
 * API 응답도 같은 양식으로 보내면 프론트엔드에서 처리하기 쉽습니다.
 *
 * 기존에 3가지 다른 형식으로 에러를 보내던 것을 이 함수들로 통일합니다.
 *
 * 사용 예시:
 * - apiSuccess({ data }) → 200 성공 응답
 * - apiError('잘못된 요청입니다.', 400) → 에러 응답
 * - apiPaginated(items, 100, 1, 20) → 페이지네이션 응답
 */
import { NextResponse } from 'next/server'

/**
 * API 성공 응답
 *
 * 마트에서 물건을 사면 영수증에 "구매 완료"라고 적혀 있는 것처럼,
 * API가 요청을 잘 처리했을 때 데이터와 함께 "성공" 응답을 보냅니다.
 *
 * @param data - 응답할 데이터 (객체, 배열 등 뭐든 OK)
 * @param status - HTTP 상태 코드 (기본값: 200 = "정상")
 *
 * @example
 * return apiSuccess({ user: { name: '홍길동' } })
 * return apiSuccess({ id: '123' }, 201)  // 201 = "생성 완료"
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * API 에러 응답
 *
 * 식당에서 "죄송합니다, 재료가 소진되었습니다"라고 안내하는 것처럼,
 * API도 문제가 생기면 왜 안 되는지 이유를 알려줍니다.
 *
 * @param error - 에러 메시지 (사용자에게 보여줄 문구)
 * @param status - HTTP 상태 코드 (기본값: 400 = "잘못된 요청")
 *
 * 자주 쓰는 상태 코드:
 * - 400: 잘못된 요청 (필수값 누락 등)
 * - 401: 인증 필요 (로그인 안 함)
 * - 403: 권한 없음 (접근 불가)
 * - 404: 찾을 수 없음 (데이터 없음)
 * - 409: 충돌 (이미 존재하는 데이터)
 * - 500: 서버 오류 (내부 에러)
 *
 * @example
 * return apiError('제목을 입력해주세요.', 400)
 * return apiError('권한이 없습니다.', 403)
 * return apiError('서버 오류가 발생했습니다.', 500)
 */
export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

/**
 * API 페이지네이션 응답
 *
 * 도서관에서 책을 검색하면 "총 150권 중 1~20권"이라고 알려주듯이,
 * 목록 데이터를 응답할 때 전체 개수와 현재 페이지 정보를 함께 보냅니다.
 *
 * @param data - 현재 페이지의 데이터 배열
 * @param total - 전체 데이터 개수
 * @param page - 현재 페이지 번호
 * @param limit - 페이지당 데이터 개수
 *
 * @example
 * return apiPaginated(users, 150, 1, 20)
 * // → { data: [...], total: 150, page: 1, limit: 20 }
 */
export function apiPaginated<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({ data, total, page, limit })
}
