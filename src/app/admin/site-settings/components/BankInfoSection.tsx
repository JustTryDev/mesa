/**
 * 은행 정보 섹션
 *
 * 입금 계좌 정보를 관리합니다.
 * 비유: 견적서/청구서 하단의 입금 안내란
 */

"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettingsFormData } from "../schema"

interface BankInfoSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

export default function BankInfoSection({ form }: BankInfoSectionProps) {
  const { register } = form

  return (
    <div className="space-y-6">
      {/* 은행명 / 계좌번호 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank_name" className="text-sm font-medium">
            은행명
          </Label>
          <Input id="bank_name" {...register("bank_name")} placeholder="예: 기업은행" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_account" className="text-sm font-medium">
            계좌번호
          </Label>
          <Input
            id="bank_account"
            {...register("bank_account")}
            placeholder="예: 270-188626-04-011"
          />
        </div>
      </div>

      {/* 예금주 */}
      <div className="space-y-2">
        <Label htmlFor="bank_holder" className="text-sm font-medium">
          예금주
        </Label>
        <Input
          id="bank_holder"
          {...register("bank_holder")}
          placeholder="예: 주식회사 인프라이즈"
        />
      </div>
    </div>
  )
}
