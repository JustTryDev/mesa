/**
 * 주소 정보 섹션
 *
 * 사업장 주소, 우편번호를 관리합니다.
 * 비유: 명함 뒷면의 오시는 길
 */

"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettingsFormData } from "../schema"

interface AddressSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

export default function AddressSection({ form }: AddressSectionProps) {
  const { register } = form

  return (
    <div className="space-y-6">
      {/* 기본 주소 */}
      <div className="space-y-2">
        <Label htmlFor="address_main" className="text-sm font-medium">
          주소
        </Label>
        <Input
          id="address_main"
          {...register("address_main")}
          placeholder="예: 인천 남동구 서창남로 45 (서창동, 로데오프라자)"
        />
      </div>

      {/* 우편번호 / 상세 주소 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postal_code" className="text-sm font-medium">
            우편 번호
          </Label>
          <Input id="postal_code" {...register("postal_code")} placeholder="예: 21617" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_detail" className="text-sm font-medium">
            상세 주소
          </Label>
          <Input id="address_detail" {...register("address_detail")} placeholder="예: 304-27" />
        </div>
      </div>
    </div>
  )
}
