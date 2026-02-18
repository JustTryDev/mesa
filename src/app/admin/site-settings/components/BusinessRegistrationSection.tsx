/**
 * 사업자 등록 섹션
 *
 * 사업자등록번호, 통신판매업신고번호, 업태, 종목을 관리합니다.
 * 비유: 가게 벽에 걸린 사업자등록증 정보
 */

"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettingsFormData } from "../schema"

interface BusinessRegistrationSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

export default function BusinessRegistrationSection({ form }: BusinessRegistrationSectionProps) {
  const { register } = form

  return (
    <div className="space-y-6">
      {/* 사업자등록번호 / 통신판매업신고번호 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_number" className="text-sm font-medium">
            사업자등록번호
          </Label>
          <Input
            id="business_number"
            {...register("business_number")}
            placeholder="예: 150-81-03714"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecommerce_number" className="text-sm font-medium">
            통신판매업신고번호
          </Label>
          <Input
            id="ecommerce_number"
            {...register("ecommerce_number")}
            placeholder="예: 2024-인천남동구-0655"
          />
        </div>
      </div>

      {/* 업태 */}
      <div className="space-y-2">
        <Label htmlFor="business_type" className="text-sm font-medium">
          업태
        </Label>
        <Input id="business_type" {...register("business_type")} placeholder="예: 도소매업" />
      </div>

      {/* 종목 */}
      <div className="space-y-2">
        <Label htmlFor="business_item" className="text-sm font-medium">
          종목
        </Label>
        <Input
          id="business_item"
          {...register("business_item")}
          placeholder="예: 판촉물, 기념품 외"
        />
      </div>
    </div>
  )
}
