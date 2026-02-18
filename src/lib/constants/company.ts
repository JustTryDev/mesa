/**
 * 회사 정보 상수
 *
 * TODO: 아래 값을 실제 회사 정보로 변경하세요.
 * 또는 site_settings 테이블에서 동적으로 관리할 수 있습니다.
 */

export const COMPANY_INFO = {
  phone: "02-1234-5678",
  email: "support@example.com",
  name: "YOUR_COMPANY_NAME",
  fullName: "(주)YOUR_COMPANY",
  ceo: "대표자명",
  businessNumber: "000-00-00000",
  address: "서울특별시 강남구 테헤란로 1",
  addressDetail: "1층",
  businessType: "서비스업",
  businessItem: "소프트웨어 개발",
} as const

export const CONTACT_LINKS = {
  tel: `tel:${COMPANY_INFO.phone}`,
  mailto: `mailto:${COMPANY_INFO.email}`,
} as const
