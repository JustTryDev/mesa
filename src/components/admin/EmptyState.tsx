/**
 * 데이터 없음 / 검색 결과 없음 UI
 *
 * 비유: 도서관에서 책을 찾았는데 결과가 없을 때 보여주는 안내문과 같습니다.
 * 검색 중이면 "검색 결과가 없습니다", 아니면 "등록된 OO이(가) 없습니다".
 *
 * 12개 파일에서 각각 만들던 것을 이 컴포넌트 하나로 통일합니다.
 */
import { Inbox, Search } from 'lucide-react'

interface EmptyStateProps {
  /** 검색 중인지 여부 */
  hasSearch?: boolean
  /** 엔티티 이름 (예: '고객', '회사') */
  entityName: string
  /** 커스텀 아이콘 */
  icon?: React.ReactNode
}

export default function EmptyState({
  hasSearch,
  entityName,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      {icon ||
        (hasSearch ? (
          <Search className="w-12 h-12 mb-4" />
        ) : (
          <Inbox className="w-12 h-12 mb-4" />
        ))}
      <p className="text-sm">
        {hasSearch
          ? '검색 결과가 없습니다.'
          : `등록된 ${entityName}이(가) 없습니다.`}
      </p>
    </div>
  )
}
