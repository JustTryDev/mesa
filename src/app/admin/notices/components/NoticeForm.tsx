/**
 * 공지사항 폼 컴포넌트
 * React Hook Form + Zod 사용
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Eye, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import dynamic from 'next/dynamic'

// TipTap 에디터는 브라우저 API를 사용하므로 SSR 비활성화 + 동적 임포트로 번들 분리
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor').then(mod => ({ default: mod.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100" /> }
)
import NoticePreview from './NoticePreview'
import { useCategories } from '@/hooks'
import type { Notice, NoticeFormData } from '@/types/notice'

// Zod 스키마
const noticeSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 200자 이내로 입력하세요'),
  content: z.string().min(1, '요약을 입력하세요').max(500, '요약은 500자 이내로 입력하세요'),
  detailed_content: z.string().min(10, '본문을 10자 이상 입력하세요'),
  category_id: z.string().nullable(),
  is_pinned: z.boolean(),
  is_published: z.boolean(),
})

type NoticeFormValues = z.infer<typeof noticeSchema>

interface NoticeFormProps {
  notice?: Notice | null
  onSubmit: (data: NoticeFormData) => Promise<boolean>
  isSubmitting?: boolean
  /** 모달 모드: 저장 성공 시 호출 (없으면 router.push로 목록 이동) */
  onSuccess?: () => void
  /** 모달 모드: 취소 시 호출 (없으면 router.push로 목록 이동) */
  onCancel?: () => void
}

export default function NoticeForm({
  notice,
  onSubmit,
  isSubmitting = false,
  onSuccess,
  onCancel,
}: NoticeFormProps) {
  const router = useRouter()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice?.title || '',
      content: notice?.content || '',
      detailed_content: notice?.detailed_content || '',
      category_id: notice?.category_id || null,
      is_pinned: notice?.is_pinned || false,
      is_published: notice?.is_published ?? true,
    },
  })

  const formValues = watch()

  const handleFormSubmit = async (data: NoticeFormValues) => {
    const success = await onSubmit(data as NoticeFormData)
    if (success) {
      // 모달 모드면 콜백, 아니면 페이지 이동
      if (onSuccess) onSuccess()
      else router.push('/admin/notices')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="공지사항 제목을 입력하세요"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>로딩 중...</SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 요약 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              요약 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="목록에 표시될 요약 내용을 입력하세요"
              rows={3}
              {...register('content')}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {formValues.content?.length || 0}/500
            </p>
          </div>
        </div>

        {/* 본문 섹션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            본문 <span className="text-red-500">*</span>
          </h2>

          <Controller
            name="detailed_content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
                placeholder="공지사항 본문을 입력하세요..."
              />
            )}
          />
          {errors.detailed_content && (
            <p className="text-sm text-red-500">{errors.detailed_content.message}</p>
          )}
        </div>

        {/* 설정 섹션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">설정</h2>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* 공개 여부 */}
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <Label htmlFor="is_published" className="cursor-pointer">
                공개 여부
              </Label>
              <Controller
                name="is_published"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_published"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* 상단 고정 */}
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <Label htmlFor="is_pinned" className="cursor-pointer">
                상단 고정
              </Label>
              <Controller
                name="is_pinned"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_pinned"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel ? onCancel() : router.push('/admin/notices')}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
          >
            <Eye className="w-4 h-4 mr-2" />
            미리보기
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#ffd93d] hover:bg-[#ffd93d]/90 text-gray-900"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {notice ? '수정' : '저장'}
          </Button>
        </div>
      </form>

      {/* 미리보기 모달 */}
      <NoticePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        data={formValues as NoticeFormData}
        categories={categories}
      />
    </>
  )
}
