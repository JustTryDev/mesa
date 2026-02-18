/**
 * 공지사항 작성 페이지
 */
'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NoticeForm } from '../components'
import { useNotices } from '@/hooks'
import type { NoticeFormData } from '@/types/notice'

export default function NewNoticePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createNotice } = useNotices({ autoFetch: false })

  const handleSubmit = async (data: NoticeFormData): Promise<boolean> => {
    setIsSubmitting(true)
    const result = await createNotice({
      title: data.title,
      content: data.content,
      detailed_content: data.detailed_content,
      category_id: data.category_id,
      is_pinned: data.is_pinned,
      is_published: data.is_published,
    })
    setIsSubmitting(false)
    return !!result
  }

  return (
    <div className="min-h-full p-4 lg:p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/notices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">새 공지사항</h1>
          <p className="text-sm text-gray-500">새로운 공지사항을 작성합니다.</p>
        </div>
      </div>

      {/* 폼 */}
      <NoticeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
