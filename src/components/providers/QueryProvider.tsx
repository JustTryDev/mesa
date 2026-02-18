/**
 * TanStack Query Provider
 *
 * 📌 TanStack Query란?
 * 서버 데이터를 자동으로 캐싱하고 관리하는 도구입니다.
 * 비유: "매번 냉장고를 열어보는 대신, 메모장에 적어놓고 필요할 때만 확인하는 것"
 *
 * 📌 왜 이렇게 만들었나?
 * - Next.js App Router에서는 서버/브라우저 환경이 다르므로, 각각에 맞는 QueryClient를 만듬
 * - 브라우저에서는 한 번 만든 것을 계속 재사용 (싱글톤 패턴)
 * - 서버에서는 매번 새로 만듬 (사용자간 데이터가 섞이지 않도록)
 */
'use client'

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

// QueryClient를 만드는 공장 함수
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 데이터를 가져온 후 60초 동안은 "신선한" 상태로 간주
        // → 60초 내 같은 요청이 오면 서버에 다시 물어보지 않고 캐시된 것 사용
        staleTime: 60 * 1000,
        // 네트워크 에러 시 자동 재시도 1회 (기본 3회는 과함)
        retry: 1,
        // 브라우저 탭을 다시 클릭할 때 자동으로 데이터 새로고침
        refetchOnWindowFocus: false,
      },
    },
  })
}

// 브라우저에서 사용할 싱글톤 인스턴스
let browserQueryClient: QueryClient | undefined = undefined

// 전역에서 queryClient에 접근할 수 있도록 export
// invalidateLookupCache처럼 컴포넌트 밖에서 캐시 무효화가 필요할 때 사용
export function getQueryClient() {
  if (isServer) {
    // 서버: 항상 새로운 QueryClient 생성 (사용자간 데이터 격리)
    return makeQueryClient()
  } else {
    // 브라우저: 처음 한 번만 만들고 계속 재사용
    // React가 첫 렌더링 중 suspend하면 다시 만들지 않도록 방지
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState를 사용하지 않는 이유:
  // Suspense boundary 없이 useState로 만들면, React가 초기 렌더 중 suspend 시
  // 클라이언트를 버리고 다시 만들 수 있음
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
