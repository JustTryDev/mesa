/**
 * 파일 미리보기 다이얼로그
 * PDF: iframe으로 인라인 뷰어
 * 이미지(JPG/PNG/WebP): img 태그로 표시
 * 기타: 다운로드 안내
 */
'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { Download, Loader2, FileText, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase/client'
import type { FileInfo } from '@/components/ui/FileUpload'
import { IMAGE_EXTENSIONS_WITH_DOT, PDF_EXTENSIONS } from '@/lib/constants/file-types'

/** 파일 확장자 추출 */
function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf('.'))
}

/** 미리보기 타입 판별 */
function getPreviewType(filename: string): 'image' | 'pdf' | 'none' {
  const ext = getFileExtension(filename)
  if (IMAGE_EXTENSIONS_WITH_DOT.includes(ext)) return 'image'
  if (PDF_EXTENSIONS.includes(ext)) return 'pdf'
  return 'none'
}

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileInfo | null
  bucketName: string
}

export default function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  bucketName,
}: FilePreviewDialogProps) {
  // signed URL 조회 (다이얼로그 열릴 때만 실행)
  const { data: signedUrl = null, isLoading } = useQuery({
    queryKey: ['filePreview-signedUrl', bucketName, file?.path],
    queryFn: async () => {
      if (!file) return null
      const supabase = getSupabase()
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(file.path, 300) // 5분 유효

      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
      return null
    },
    enabled: open && !!file,
    // signed URL은 5분 유효 → 4분마다 갱신
    staleTime: 4 * 60 * 1000,
  })

  if (!file) return null

  const previewType = getPreviewType(file.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !signedUrl ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              파일을 불러올 수 없습니다.
            </div>
          ) : previewType === 'image' ? (
            // 이미지 미리보기
            <div className="relative flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <Image
                src={signedUrl}
                alt={file.name}
                width={800}
                height={600}
                className="max-w-full max-h-[65vh] object-contain rounded"
                unoptimized
              />
            </div>
          ) : previewType === 'pdf' ? (
            // PDF 미리보기
            <iframe
              src={signedUrl}
              title={file.name}
              className="w-full h-[65vh] rounded-lg border border-gray-200"
            />
          ) : (
            // 미리보기 불가 파일
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <FileText className="w-12 h-12" />
              <p className="text-sm">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {signedUrl && (
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" size="sm" asChild>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                새 탭에서 열기
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href={signedUrl} download={file.name}>
                <Download className="w-4 h-4 mr-1.5" />
                다운로드
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { getPreviewType, getFileExtension }
