/**
 * 공지사항 미리보기 모달 컴포넌트
 */
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import dynamic from 'next/dynamic'

// TipTap 뷰어는 브라우저 API를 사용하므로 SSR 비활성화 + 동적 임포트로 번들 분리
const RichTextViewer = dynamic(
  () => import('@/components/ui/RichTextViewer'),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-lg bg-gray-100" /> }
)
import type { NoticeFormData } from '@/types/notice'
import type { NoticeCategory } from '@/types/notice'

interface NoticePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: NoticeFormData
  categories: NoticeCategory[]
}

export default function NoticePreview({
  open,
  onOpenChange,
  data,
  categories,
}: NoticePreviewProps) {
  const category = categories.find(c => c.id === data.category_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-500">
            미리보기
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 카테고리 */}
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {category.name}
            </span>
          )}

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900">
            {data.title || '제목 없음'}
          </h1>

          {/* 요약 */}
          <p className="text-gray-600 border-l-4 border-gray-200 pl-4">
            {data.content || '요약 없음'}
          </p>

          {/* 구분선 */}
          <hr className="border-gray-200" />

          {/* 본문 */}
          <div className="prose prose-gray max-w-none">
            {data.detailed_content ? (
              <RichTextViewer content={data.detailed_content} />
            ) : (
              <p className="text-gray-400 italic">본문 내용이 없습니다.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
