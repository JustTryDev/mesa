'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Download, Loader2, Eye, Image, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase/client'
import { formatFileSize } from '@/lib/format'
import FilePreviewDialog, { getPreviewType } from '@/components/ui/FilePreviewDialog'

// 파일 정보 타입
export interface FileInfo {
  name: string       // 원본 파일명
  path: string       // Storage 경로
  size: number       // 파일 크기 (bytes)
  uploadedAt: string // 업로드 시간
}

interface FileUploadProps {
  bucketName: string               // Storage 버킷명
  folderPath: string               // 폴더 경로 (예: 'customers/uuid')
  existingFiles: FileInfo[]        // 기존 파일 목록
  onFilesChange: (files: FileInfo[]) => void  // 파일 변경 콜백
  accept?: string                  // 허용 MIME 타입
  maxFiles?: number                // 최대 파일 수
  maxSize?: number                 // 최대 파일 크기 (bytes)
  disabled?: boolean
}

export default function FileUpload({
  bucketName,
  folderPath,
  existingFiles,
  onFilesChange,
  accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx',
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 업로드 처리
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 최대 파일 수 확인
    if (existingFiles.length + files.length > maxFiles) {
      setError(`최대 ${maxFiles}개까지 업로드 가능합니다.`)
      return
    }

    setUploading(true)
    setError(null)

    const supabase = getSupabase()
    const newFiles: FileInfo[] = []

    for (const file of Array.from(files)) {
      // 파일 크기 확인
      if (file.size > maxSize) {
        setError(`${file.name}: 파일 크기가 ${formatFileSize(maxSize)}를 초과합니다.`)
        continue
      }

      // 고유한 파일 경로 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${folderPath}/${timestamp}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) {
        console.error('[FileUpload] 업로드 오류:', uploadError)
        setError(`${file.name}: 업로드에 실패했습니다.`)
        continue
      }

      newFiles.push({
        name: file.name,
        path: filePath,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      })
    }

    if (newFiles.length > 0) {
      onFilesChange([...existingFiles, ...newFiles])
    }

    setUploading(false)
    // 입력 필드 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [bucketName, folderPath, existingFiles, maxFiles, maxSize, onFilesChange])

  // 파일 삭제 처리
  const handleDelete = useCallback(async (fileToDelete: FileInfo) => {
    const supabase = getSupabase()

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileToDelete.path])

    if (deleteError) {
      console.error('[FileUpload] 삭제 오류:', deleteError)
      setError('파일 삭제에 실패했습니다.')
      return
    }

    onFilesChange(existingFiles.filter(f => f.path !== fileToDelete.path))
  }, [bucketName, existingFiles, onFilesChange])

  // 파일 다운로드 처리
  const handleDownload = useCallback(async (file: FileInfo) => {
    const supabase = getSupabase()

    const { data, error: downloadError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(file.path, 60) // 60초 유효

    if (downloadError || !data?.signedUrl) {
      console.error('[FileUpload] 다운로드 URL 생성 오류:', downloadError)
      setError('다운로드 링크 생성에 실패했습니다.')
      return
    }

    window.open(data.signedUrl, '_blank')
  }, [bucketName])

  return (
    <div className="space-y-3">
      {/* 업로드 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || existingFiles.length >= maxFiles}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? '업로드 중...' : '파일 선택'}
        </Button>
        <span className="text-xs text-gray-400">
          {existingFiles.length}/{maxFiles}개
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* 파일 목록 */}
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          {existingFiles.map((file) => {
            const preview = getPreviewType(file.name)
            const FileIcon_ = preview === 'image' ? Image : preview === 'pdf' ? FileIcon : FileText
            return (
              <div
                key={file.path}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <FileIcon_ className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                {/* 미리보기 가능한 파일만 미리보기 버튼 표시 */}
                {preview !== 'none' && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="text-gray-400 hover:text-purple-500"
                    title="미리보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="text-gray-400 hover:text-blue-500"
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </button>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    className="text-gray-400 hover:text-red-500"
                    title="삭제"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 파일 미리보기 다이얼로그 */}
      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => { if (!open) setPreviewFile(null) }}
        file={previewFile}
        bucketName={bucketName}
      />
    </div>
  )
}
