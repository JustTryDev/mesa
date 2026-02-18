# Next.js Admin Starter Kit

VS Code 스타일 멀티탭/패널 어드민 + Supabase 인증이 포함된 Next.js 풀스택 스타터킷입니다.

## 포함된 기능

### 어드민 시스템
- VS Code 스타일 멀티탭 / 듀얼 패널
- 드래그앤드롭 사이드바 (폴더 구성, 즐겨찾기, 검색)
- IframePool (탭 전환 시 상태 보존)
- 3단계 권한 (super_admin / admin / staff)
- 메뉴별 세부 접근 제어

### 인증
- Supabase Auth (이메일/비밀번호)
- 직원/고객 이중 사용자 구조
- 쿠키 기반 세션 관리

### UI 컴포넌트 (45개+)
- shadcn/ui 기본 컴포넌트 28개
- 커스텀: StatusBadge, TagInput, InlineEditCell, RichTextEditor 등 17개+
- 테이블: 컬럼 리사이즈, 숨기기, 다중 선택, 플로팅 스크롤바

### 커스텀 훅 (27개)
- useDebounce, useDisclosure, useFormDialog, useMediaQuery
- useTableSettings, useBulkSelection, useDragDrop
- useAdminNavigation, useMenuAccessGuard 등

### 유틸리티
- 날짜/금액/전화번호 포맷팅 (한국 특화)
- API 응답 헬퍼 (apiSuccess, apiError, apiPaginated)
- 이미지 클라이언트 압축
- localStorage 통합 관리

## 설치 방법

### 1. 저장소 클론

```bash
# GitHub Template 사용 시
# "Use this template" 버튼 클릭 → 새 저장소 생성

# 또는 직접 클론
git clone https://github.com/YOUR_USERNAME/nextjs-admin-starter.git
cd nextjs-admin-starter
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 프로젝트 생성

[supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.

### 4. DB 마이그레이션

Supabase Dashboard > SQL Editor에서 `supabase/migrations/` 폴더의 SQL 파일을 순서대로 실행합니다:

```
001_initial_schema.sql    → 직원, 고객, UI 설정 테이블
002_admin_sidebar.sql     → 사이드바 설정 테이블
003_notices.sql           → 공지사항 테이블
004_site_settings.sql     → 사이트 설정 테이블
005_rls_and_functions.sql → RLS 정책 + 트리거 함수
```

### 5. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 Supabase 프로젝트의 URL과 키를 입력합니다.

### 6. 첫 번째 관리자 계정 생성

Supabase Dashboard > Authentication > Users에서 새 사용자를 생성한 후,
SQL Editor에서 다음을 실행합니다:

```sql
INSERT INTO employees (id, email, name, role)
VALUES (
  '생성한-사용자-UUID',
  'admin@example.com',
  '관리자',
  'super_admin'
);
```

### 7. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## 브랜드 커스터마이징

### 색상 변경 (1단계로 완료!)

`src/app/globals.css`에서 CSS 변수만 바꾸면 됩니다:

```css
:root {
  --color-primary: #3b82f6;     /* ← 원하는 색상으로 변경 */
  --color-primary-light: #60a5fa;
  --color-primary-dark: #2563eb;
}
```

OKLCH 변환이 필요한 경우: [oklch.com](https://oklch.com)

### 회사 정보 변경

`src/lib/constants/company.ts`에서 회사 정보를 수정합니다.

## 어드민 메뉴 추가 방법

```typescript
// 1. src/lib/constants/adminMenus.ts에 추가
{
  id: "my-feature",
  label: "내 기능",
  href: "/admin/my-feature",
  icon: Star,  // lucide-react 아이콘
  group: "content",
}

// 2. src/app/admin/my-feature/page.tsx 생성
// → 끝! 사이드바 + 탭에 자동 반영
```

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui, Lucide Icons |
| Animation | Framer Motion |
| State | Zustand 5 (클라이언트), TanStack Query (서버) |
| Form | React Hook Form + Zod |
| Editor | TipTap |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Toast | Sonner |
| DnD | @dnd-kit |

## 폴더 구조

```
src/
├── app/
│   ├── page.tsx               # 랜딩 페이지
│   ├── auth/                  # 로그인, 회원가입
│   ├── admin/                 # 어드민 페이지
│   └── api/                   # API 라우트
├── components/
│   ├── ui/                    # shadcn/ui + 커스텀
│   ├── admin/                 # 어드민 레이아웃
│   └── providers/             # QueryProvider 등
├── hooks/                     # 커스텀 훅 27개
├── stores/                    # Zustand 스토어
├── lib/
│   ├── supabase/              # Supabase 클라이언트
│   ├── auth/                  # 인증 헬퍼
│   ├── constants/             # 상수 (메뉴, 페이지네이션 등)
│   ├── format.ts              # 포맷팅 유틸
│   └── date.ts                # 한국 시간(KST) 유틸
├── contexts/                  # AuthContext
└── types/                     # 공통 타입
```

## 라이선스

MIT
