// ============================================================
// 공통 타입 정의 (Common Types)
// 여러 페이지/컴포넌트에서 반복적으로 사용되는 타입을 한 곳에 모아둡니다.
// 마치 학교에서 모든 반이 공유하는 '공용 문구함'처럼,
// 자주 쓰는 타입을 여기에 넣어두면 어디서든 꺼내 쓸 수 있습니다.
// ============================================================

/** 전화번호 항목 (JSONB 배열용) - 연락처에 라벨(예: '사무실')과 번호를 함께 저장 */
export interface PhoneEntry {
  label: string
  number: string
}

/** 이메일 항목 (JSONB 배열용) - 이메일에 라벨(예: '업무용')과 주소를 함께 저장 */
export interface EmailEntry {
  label: string
  address: string
}

/**
 * 테이블 정렬 설정 - 어떤 필드를 기준으로, 오름차순/내림차순으로 정렬할지 지정
 *
 * 제네릭(Generic)이란?
 * 마치 '빈 칸이 있는 양식지'처럼, 사용할 때 원하는 타입을 채워 넣는 것입니다.
 * 예: SortConfig<'name' | 'date'> → field는 'name' 또는 'date'만 가능
 * 예: SortConfig → field는 아무 문자열이나 가능 (기본값 = string)
 */
export interface SortConfig<T extends string = string> {
  field: T
  direction: 'asc' | 'desc'
}
