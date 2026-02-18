/**
 * 사이트 기본 정보 섹션
 *
 * 사이트 이름, 설명, 알림용 이름을 관리합니다.
 * 비유: 명함의 앞면 — 가장 먼저 보이는 기본 정보
 */

"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SiteSettingsFormData } from "../schema"

interface BasicInfoSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

export default function BasicInfoSection({ form }: BasicInfoSectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form
  const siteName = watch("site_name") || ""
  const siteNameForNotification = watch("site_name_for_notification") || ""

  return (
    <div className="space-y-6">
      {/* 사이트 이름 */}
      <div className="space-y-2">
        <Label htmlFor="site_name" className="text-sm font-medium">
          사이트 이름
        </Label>
        <p className="text-xs text-gray-500">브라우저 탭이나 소셜 미디어에 공유할 때 표시됩니다.</p>
        <div className="relative">
          <Input
            id="site_name"
            {...register("site_name")}
            placeholder="예: Qudisom - 인형 제작 OEM 전문"
            maxLength={50}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400">
            {siteName.length}/50
          </span>
        </div>
        {errors.site_name && <p className="text-xs text-red-500">{errors.site_name.message}</p>}
      </div>

      {/* 사이트 설명 */}
      <div className="space-y-2">
        <Label htmlFor="site_description" className="text-sm font-medium">
          사이트 설명
        </Label>
        <p className="text-xs text-gray-500">
          사이트를 대표하는 문장이나 키워드 사용을 추천합니다. (SEO 메타 설명)
        </p>
        <Textarea
          id="site_description"
          {...register("site_description")}
          placeholder="예: 쿠디솜은 봉제인형, 키링, 쿠션 등 캐릭터 상품 OEM 제작 전문 업체입니다."
          maxLength={200}
          rows={3}
        />
        {errors.site_description && (
          <p className="text-xs text-red-500">{errors.site_description.message}</p>
        )}
      </div>

      {/* 메일/SMS 전용 사이트 이름 */}
      <div className="space-y-2">
        <Label htmlFor="site_name_for_notification" className="text-sm font-medium">
          메일 · SMS 전용 사이트 이름
        </Label>
        <p className="text-xs text-gray-500">
          전용 이름을 지정하지 않으면 사이트 이름으로 적용됩니다.
        </p>
        <div className="relative">
          <Input
            id="site_name_for_notification"
            {...register("site_name_for_notification")}
            placeholder="예: 쿠디솜(QUDISOM)"
            maxLength={40}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400">
            {siteNameForNotification.length}/40
          </span>
        </div>
      </div>
    </div>
  )
}
