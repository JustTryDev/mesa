/**
 * 공지사항 수정 페이지
 */
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NoticeForm } from '../components'
import { useNotices } from '@/hooks'
import { getSupabase } from '@/lib/supabase/client'
import type { NoticeFormData, NoticeWithCategory } from '@/types/notice'

export default function EditNoticePage() {
  const params = useParams()
  const id = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateNotice } = useNotices({ autoFetch: false })

  // 공지사항 단건 조회 (useQuery로 자동 캐싱)
  const { data: notice = null, isLoading } = useQuery({
    queryKey: ['admin-notice-detail', id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notices')
        .select(`
          *,
          category:notice_categories(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('[Notice] 조회 실패:', error)
        return null
      }
      return data as NoticeWithCategory
    },
    // id가 유효할 때만 쿼리 실행
    enabled: !!id,
  })

  const handleSubmit = async (data: NoticeFormData): Promise<boolean> => {
    setIsSubmitting(true)
    const result = await updateNotice(id, {
      title: data.title,
      content: data.content,
      detailed_content: data.detailed_content,
      category_id: data.category_id,
      is_pinned: data.is_pinned,
      is_published: data.is_published,
    })
    setIsSubmitting(false)
    return result
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            공지사항을 찾을 수 없습니다
          </h2>
          <p className="text-gray-500 mb-4">
            요청하신 공지사항이 존재하지 않거나 삭제되었습니다.
          </p>
          <Link href="/admin/notices">
            <Button>목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-4 lg:p-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-4"
      >
        <Link href="/admin/notices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">공지사항 수정</h1>
          <p className="text-sm text-gray-500">공지사항을 수정합니다.</p>
        </div>
      </motion.div>

      {/* 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <NoticeForm
          notice={notice}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </motion.div>
    </div>
  )
}
