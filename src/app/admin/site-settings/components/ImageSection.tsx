/**
 * 사이트 이미지 섹션
 *
 * 파비콘, OG 대표 이미지, 로고를 관리합니다.
 * 비유: 회사의 간판, 명함 로고, SNS 프로필 사진을 한 곳에서 관리
 */

"use client"

import { useState, useRef } from "react"
import { UseFormReturn } from "react-hook-form"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { compressImage } from "@/lib/imageCompressor"
import type { SiteSettingsFormData } from "../schema"

interface ImageSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

/** 개별 이미지 업로드 컴포넌트 */
function ImageUploadField({
  label,
  description,
  value,
  onChange,
  accept = "image/*",
  folder = "site-settings",
  recommend,
}: {
  label: string
  description: string
  value: string
  onChange: (url: string) => void
  accept?: string
  folder?: string
  recommend?: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 → 압축 → Presigned URL → R2 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. 이미지 압축 (GIF 제외)
      const processedFile = await compressImage(file)

      // 2. 확장자 추출
      const ext = processedFile.name.split(".").pop()?.toLowerCase() || "jpg"

      // 3. Presigned URL 요청
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileExtension: ext,
          contentType: processedFile.type,
          folder,
        }),
      })

      if (!presignRes.ok) throw new Error("업로드 URL 생성 실패")

      const { uploadUrl, imageUrl } = await presignRes.json()

      // 4. R2에 직접 업로드
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": processedFile.type },
        body: processedFile,
      })

      if (!uploadRes.ok) throw new Error("파일 업로드 실패")

      // 5. URL 저장
      onChange(imageUrl)
      toast.success("이미지가 업로드되었습니다.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "업로드 실패"
      toast.error(message)
    } finally {
      setUploading(false)
      // input 초기화 (같은 파일 재선택 가능)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-gray-500">{description}</p>
      {recommend && <p className="text-xs text-blue-500">{recommend}</p>}

      <div className="space-y-3">
        {/* 미리보기 */}
        {value ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Image src={value} alt={label} fill className="object-contain" sizes="80px" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 transition-colors hover:bg-black/80"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <ImageIcon className="h-7 w-7 text-gray-300" />
          </div>
        )}

        {/* 업로드 버튼 */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {uploading ? "업로드 중..." : "파일 선택"}
        </Button>
      </div>
    </div>
  )
}

export default function ImageSection({ form }: ImageSectionProps) {
  const { setValue, watch } = form
  const faviconUrl = watch("favicon_url") || ""
  const ogImageUrl = watch("og_image_url") || ""
  const logoUrl = watch("logo_url") || ""

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* 파비콘 */}
      <ImageUploadField
        label="파비콘"
        description="브라우저 탭에 표시되는 아이콘입니다."
        recommend="권장: 최소 16x16 / PNG, ICO"
        value={faviconUrl}
        onChange={(url) => setValue("favicon_url", url, { shouldDirty: true })}
        accept="image/png,image/x-icon,image/svg+xml"
        folder="site-settings/favicon"
      />

      {/* OG 대표 이미지 */}
      <ImageUploadField
        label="대표 이미지 (OG Image)"
        description="카카오톡 또는 Facebook 등에서 링크와 함께 나타날 이미지를 설정합니다."
        recommend="권장: 1200x630px / PNG, JPEG"
        value={ogImageUrl}
        onChange={(url) => setValue("og_image_url", url, { shouldDirty: true })}
        accept="image/jpeg,image/png,image/webp"
        folder="site-settings/og"
      />

      {/* 로고 */}
      <ImageUploadField
        label="로고"
        description="사이트 상단, 이메일, 견적서 등에 표시되는 로고입니다."
        recommend="권장: 배경 투명 PNG"
        value={logoUrl}
        onChange={(url) => setValue("logo_url", url, { shouldDirty: true })}
        accept="image/png,image/svg+xml,image/webp"
        folder="site-settings/logo"
      />
    </div>
  )
}
