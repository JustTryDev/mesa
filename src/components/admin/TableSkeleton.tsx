/**
 * 테이블 로딩 스켈레톤 UI
 *
 * 데이터를 불러오는 동안 보여주는 "회색 깜빡이는 상자"입니다.
 * 비유: 레스토랑에서 음식이 나오기 전에 빈 접시를 먼저 세팅하는 것과 같습니다.
 *
 * 11개 파일에서 각각 만들던 것을 이 컴포넌트 하나로 통일합니다.
 */
export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-8 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
