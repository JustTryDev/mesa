# CLAUDE.md

## 프로젝트 정보
- 프로젝트명: TODO_PROJECT_NAME
- 설명: TODO_PROJECT_DESCRIPTION

## 기술 스택
- Language: TypeScript
- Framework: Next.js 16 (App Router), React 19
- Styling: Tailwind CSS 4
- UI 컴포넌트: shadcn/ui
- 아이콘: Lucide Icons
- 애니메이션: Framer Motion
- 상태관리: Zustand 5 (클라이언트 UI 상태 전용)
- 서버 데이터 관리: TanStack Query (React Query)
- 폼 관리: React Hook Form + Zod
- 에디터: TipTap (RichTextEditor)
- 패키지매니저: npm
- 백엔드/데이터베이스: Supabase (Auth, PostgreSQL, Storage)

## 개발 명령어
- `npm run dev` — 개발 서버 (localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 검사

## 언어 및 커뮤니케이션 규칙
- 코드 주석: 한국어
- 커밋 메시지: 한국어
- 변수명/함수명: 영어

## 코딩 규칙
- 들여쓰기: 2칸 (스페이스)
- 컴포넌트: PascalCase, 함수/변수: camelCase
- any 타입 사용 금지
- alert/confirm 사용 금지 → sonner toast 사용
- console.log 프로덕션 코드에 남기지 않기
- Next.js Image 필수 (<img> 태그 금지)

## 서버 데이터 조회 규칙 (CRITICAL)
- 반드시 TanStack Query(`useQuery`) 사용
- `useEffect` + `fetch` + `useState` 조합 금지

## API 라우트 규칙 (CRITICAL)
1. 인증 체크 필수: `requireEmployee()` / `requireCustomer()`
2. 응답 헬퍼 필수: `apiSuccess()` / `apiError()` / `apiPaginated()`
3. 페이지네이션: `parsePaginationParams()` 사용

## Supabase 클라이언트 규칙 (CRITICAL)
- 브라우저: `getSupabase()` (src/lib/supabase/client.ts)
- API Route: `getAdminClient()` (src/lib/supabase/admin.ts)
- 매번 새로 만들지 마세요!

## 폴더 구조
- src/app/ → 페이지 라우팅
- src/app/admin/ → 어드민 페이지
- src/app/api/ → API 라우트
- src/components/ui/ → shadcn/ui + 커스텀 UI
- src/components/admin/ → 어드민 레이아웃
- src/hooks/ → 커스텀 훅
- src/stores/ → Zustand 스토어
- src/lib/ → 유틸리티 함수
- src/types/ → TypeScript 타입 정의

## 어드민 메뉴 추가 방법
1. `src/lib/constants/adminMenus.ts`에 메뉴 추가
2. `src/app/admin/{menu-id}/page.tsx` 생성
→ 사이드바 + 탭 시스템에 자동 반영

## 브랜드 컬러
- Primary: #3b82f6 (Blue) — TODO: globals.css에서 변경
- Secondary: #1e3a5f (Dark Blue)
