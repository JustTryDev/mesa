/**
 * 사이트 설정 어드민 페이지
 *
 * 비유: 회사 총무부의 "명함 정보 관리 시스템"
 * 여기서 수정한 정보가 사이트 전체(Footer, 약관, 견적서 등)에 자동 반영됩니다.
 *
 * 구조: 단일 스크롤 폼 + 섹션별 Card로 구분
 * 하단 sticky 저장 버튼
 */

"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Settings, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { siteSettingsSchema, type SiteSettingsFormData } from "./schema"
import BasicInfoSection from "./components/BasicInfoSection"
import ImageSection from "./components/ImageSection"
import BusinessInfoSection from "./components/BusinessInfoSection"
import AddressSection from "./components/AddressSection"
import BusinessRegistrationSection from "./components/BusinessRegistrationSection"
import BankInfoSection from "./components/BankInfoSection"

export default function SiteSettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 설정 조회 (어드민 API 사용)
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/site-settings")
      if (!res.ok) throw new Error("설정 조회 실패")
      const json = await res.json()
      return json.data
    },
    enabled: !!user,
  })

  // React Hook Form 설정
  const form = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      site_name: "",
      site_description: "",
      site_name_for_notification: "",
      favicon_url: "",
      og_image_url: "",
      logo_url: "",
      company_name: "",
      company_name_en: "",
      company_full_name: "",
      ceo_name: "",
      cpo_name: "",
      company_phone: "",
      company_fax: "",
      company_email: "",
      address_main: "",
      address_detail: "",
      postal_code: "",
      business_number: "",
      ecommerce_number: "",
      business_type: "",
      business_item: "",
      bank_name: "",
      bank_account: "",
      bank_holder: "",
    },
  })

  // DB 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    if (settingsData) {
      // DB 값 중 null을 빈 문자열로 변환 (폼 입력 호환)
      const formValues: Record<string, string> = {}
      for (const [key, value] of Object.entries(settingsData)) {
        if (key === "id" || key === "created_at" || key === "updated_at") continue
        formValues[key] = (value as string) ?? ""
      }
      form.reset(formValues as SiteSettingsFormData)
    }
  }, [settingsData, form])

  // 저장 mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SiteSettingsFormData) => {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "저장 실패")
      }
      return res.json()
    },
    onSuccess: () => {
      // 어드민 + 공개 캐시 모두 무효화
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] })
      queryClient.invalidateQueries({ queryKey: ["site-settings"] })
      toast.success("사이트 설정이 저장되었습니다.")
    },
    onError: (error) => {
      toast.error(`저장 실패: ${error.message}`)
    },
  })

  const onSubmit = (data: SiteSettingsFormData) => {
    saveMutation.mutate(data)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24">
      {/* 헤더 */}
      <div className="p-6 pb-4 lg:p-8">
        <div className="mb-1 flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">사이트 설정</h1>
        </div>
        <p className="ml-9 text-sm text-gray-500">
          사이트 정보와 관련된 기본적인 설정을 합니다. 여기서 수정한 정보가 사이트 전체에
          반영됩니다.
        </p>
      </div>

      {/* 섹션별 카드 */}
      <div className="space-y-6 px-6 lg:px-8">
        {/* 사이트 기본 정보 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">사이트 기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <BasicInfoSection form={form} />
          </CardContent>
        </Card>

        {/* 사이트 이미지 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">사이트 표시 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageSection form={form} />
          </CardContent>
        </Card>

        {/* 사업자 정보 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">사업자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessInfoSection form={form} />
          </CardContent>
        </Card>

        {/* 주소 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">주소</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressSection form={form} />
          </CardContent>
        </Card>

        {/* 사업자 등록 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">사업자 등록</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessRegistrationSection form={form} />
          </CardContent>
        </Card>

        {/* 은행 정보 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">은행 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <BankInfoSection form={form} />
          </CardContent>
        </Card>
      </div>

      {/* 하단 고정 저장 버튼 */}
      <div className="fixed right-0 bottom-0 left-0 z-10 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 lg:px-8">
        <p className="text-xs text-gray-400">
          {settingsData?.updated_at
            ? `마지막 수정: ${new Date(settingsData.updated_at).toLocaleString("ko-KR")}`
            : ""}
        </p>
        <Button
          type="submit"
          disabled={saveMutation.isPending || !form.formState.isDirty}
          className="min-w-[120px]"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              저장
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
