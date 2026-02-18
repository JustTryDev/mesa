/**
 * 파일 타입 관련 상수
 *
 * 비유: 파일 캐비닛에 "이미지 파일은 이 확장자들이야"라고 라벨을 붙여둔 것
 * 여러 컴포넌트에서 이미지인지 판별할 때 이 목록을 참조합니다.
 */

/** 이미지 확장자 목록 (점 없이, 소문자) */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']

/** 이미지 확장자 목록 (점 포함, 소문자) — FilePreviewDialog 등에서 사용 */
export const IMAGE_EXTENSIONS_WITH_DOT = IMAGE_EXTENSIONS.map((ext) => `.${ext}`)

/** PDF 확장자 목록 (점 포함) */
export const PDF_EXTENSIONS = ['.pdf']
