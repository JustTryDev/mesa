/**
 * 사이트 설정 타입 정의
 *
 * 비유: 회사 명함에 들어가는 모든 정보의 "양식"
 * DB의 site_settings 테이블과 1:1 대응됩니다.
 */

export interface SiteSettings {
  id: string

  // 사이트 기본 정보
  site_name: string
  site_description: string
  site_name_for_notification: string

  // 사이트 이미지
  favicon_url: string
  og_image_url: string
  logo_url: string

  // 사업자 정보
  company_name: string
  company_name_en: string
  company_full_name: string
  ceo_name: string
  cpo_name: string
  company_phone: string
  company_fax: string
  company_email: string

  // 주소
  address_main: string
  address_detail: string
  postal_code: string

  // 사업자 등록
  business_number: string
  ecommerce_number: string
  business_type: string
  business_item: string

  // 은행 정보
  bank_name: string
  bank_account: string
  bank_holder: string

  // 타임스탬프
  created_at: string
  updated_at: string
}
