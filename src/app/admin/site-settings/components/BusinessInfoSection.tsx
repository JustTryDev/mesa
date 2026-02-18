/**
 * 사업자 정보 섹션
 *
 * 회사명, 대표자, 연락처, 이메일 등을 관리합니다.
 * 비유: 명함 앞면의 회사 정보 영역
 */

"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettingsFormData } from "../schema"

interface BusinessInfoSectionProps {
  form: UseFormReturn<SiteSettingsFormData>
}

export default function BusinessInfoSection({ form }: BusinessInfoSectionProps) {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="space-y-6">
      {/* 회사명 (한글) */}
      <div className="space-y-2">
        <Label htmlFor="company_name" className="text-sm font-medium">
          회사 · 단체명
        </Label>
        <Input id="company_name" {...register("company_name")} placeholder="예: (주)인프라이즈" />
      </div>

      {/* 회사명 (영문) */}
      <div className="space-y-2">
        <Label htmlFor="company_name_en" className="text-sm font-medium">
          회사 영문명
        </Label>
        <Input
          id="company_name_en"
          {...register("company_name_en")}
          placeholder="예: INPRISE CO., LTD"
        />
      </div>

      {/* 법인 정식 명칭 */}
      <div className="space-y-2">
        <Label htmlFor="company_full_name" className="text-sm font-medium">
          법인 정식 명칭
        </Label>
        <p className="text-xs text-gray-500">약관, 개인정보처리방침 등 법률 문서에 표시됩니다.</p>
        <Input
          id="company_full_name"
          {...register("company_full_name")}
          placeholder="예: 주식회사 인프라이즈"
        />
      </div>

      {/* 대표자 / 대표 연락처 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ceo_name" className="text-sm font-medium">
            대표자 이름
          </Label>
          <Input id="ceo_name" {...register("ceo_name")} placeholder="예: 유성민" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_phone" className="text-sm font-medium">
            대표 연락처
          </Label>
          <Input id="company_phone" {...register("company_phone")} placeholder="예: 1666-0221" />
        </div>
      </div>

      {/* CPO */}
      <div className="space-y-2">
        <Label htmlFor="cpo_name" className="text-sm font-medium">
          개인정보관리책임자 (CPO)
        </Label>
        <Input id="cpo_name" {...register("cpo_name")} placeholder="예: 유성민" />
      </div>

      {/* 대표 메일 */}
      <div className="space-y-2">
        <Label htmlFor="company_email" className="text-sm font-medium">
          대표 메일
        </Label>
        <Input
          id="company_email"
          type="email"
          {...register("company_email")}
          placeholder="예: support@qudisom.com"
        />
        {errors.company_email && (
          <p className="text-xs text-red-500">{errors.company_email.message}</p>
        )}
      </div>

      {/* 팩스 */}
      <div className="space-y-2">
        <Label htmlFor="company_fax" className="text-sm font-medium">
          팩스
        </Label>
        <Input id="company_fax" {...register("company_fax")} placeholder="예: 032-726-9175" />
      </div>
    </div>
  )
}
