/**
 * 고객 정보 수정 다이얼로그
 * 이름, 이메일, 연락처, 소속 회사, 카테고리, 부서, 직책, 연락처 정보, 계약 서류, 잔액/포인트 등 수정
 * 이메일 변경 시 별도 API(/api/admin/customers/update-email) 호출 후 나머지 필드 업데이트
 * customer_code는 읽기 전용 (DB 자동 생성)
 * 다이얼로그 열릴 때 DB에서 전체 고객 정보를 조회하여 모든 필드를 정확히 표시
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PopoverSelect from '@/components/ui/PopoverSelect'
import { Palette, Link2, FolderOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSupabase } from '@/lib/supabase/client'
import FileUpload, { type FileInfo } from '@/components/ui/FileUpload'
import CustomerFileManager from '@/components/customer-drive/CustomerFileManager'
import CompanySearchSelect from '@/components/ui/CompanySearchSelect'
import EntityMultiSearchSelect from '@/components/ui/EntityMultiSearchSelect'
import type { EntitySelection } from '@/components/ui/EntityMultiSearchSelect'
import SelectableOptionCell from '@/components/ui/SelectableOptionCell'
import LabelSelectPopover from '@/components/ui/LabelSelectPopover'
import { CompanyFormDialog } from '@/app/admin/companies/components'
import { ImporterFormDialog } from '@/app/admin/importers/components'
import { invalidateEntityCache } from '@/components/ui/EntityMultiSelectCell'
import { isValidEmail } from '@/lib/validation'
import type { PhoneEntry } from '@/types/common'

/** 부모에서 전달받는 최소 고객 정보 (목록에서 선택된 행) */
interface CustomerRow {
  id: string
  email: string | null
  name: string | null
  phones: PhoneEntry[] | null
  company_id: string | null
  customer_code: string | null
  category: string | null
  department: string | null
  position: string | null
  memo: string | null
  updated_at: string
  companies: {
    id: string
    name: string
    company_code: string
    business_number: string | null
  } | null
}

/** DB에서 조회하는 전체 고객 정보 */
interface FullCustomerData {
  id: string
  email: string | null
  name: string | null
  phones: PhoneEntry[] | null
  company_id: string | null
  customer_code: string | null
  category: string | null
  department: string | null
  position: string | null
  project_link: string | null
  fax: string | null
  homepage: string | null
  cash_receipt_number: string | null
  contract_documents: FileInfo[] | null
  prepaid_balance: number | null
  points: number | null
  memo: string | null
}

interface CustomerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerRow | null
  onSuccess: () => void
  initialTab?: 'info' | 'files'  // 파일 셀 클릭 시 'files' 탭으로 바로 열기
}

/**
 * Canva 프로젝트 생성 버튼 (편집 모달 전용)
 * Zapier 웹훅을 통해 Canva 프로젝트를 생성하고, 폴링으로 결과를 대기합니다.
 */
function CanvaProjectButton({
  customerId,
  onLinkCreated,
}: {
  customerId: string
  onLinkCreated: (link: string) => void
}) {
  const [isCreating, setIsCreating] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  const handleCreate = async () => {
    setIsCreating(true)

    try {
      const res = await fetch('/api/admin/customers/create-canva-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || '프로젝트 생성 요청에 실패했습니다.')
        setIsCreating(false)
        return
      }

      // 폴링 시작: 2초마다 project_link 확인 (최대 60초)
      const startTime = Date.now()
      const supabase = getSupabase()

      pollTimerRef.current = setInterval(async () => {
        if (Date.now() - startTime > 60000) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          setIsCreating(false)
          toast.error('프로젝트 생성 시간이 초과되었습니다. 페이지를 새로고침해 주세요.')
          return
        }

        const { data } = await supabase
          .from('customers')
          .select('project_link')
          .eq('id', customerId)
          .single()

        if (data?.project_link) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          setIsCreating(false)
          onLinkCreated(data.project_link)
        }
      }, 2000)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
      setIsCreating(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCreate}
      disabled={isCreating}
      className="shrink-0 h-9 text-xs gap-1"
    >
      {isCreating ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" />생성 중...</>
      ) : (
        <><Palette className="w-3.5 h-3.5" />Canva 생성</>
      )}
    </Button>
  )
}

// 고객 카테고리 옵션 (중앙 상수에서 가져옴)
import { CUSTOMER_CATEGORY_OPTIONS } from '@/lib/constants/customer'
const CATEGORY_OPTIONS = CUSTOMER_CATEGORY_OPTIONS

/** 폼 데이터 타입 */
interface FormData {
  email: string
  name: string
  phones: PhoneEntry[]
  companyId: string
  entities: EntitySelection[]
  category: string
  department: string
  position: string
  projectLink: string
  fax: string
  homepage: string
  cashReceiptNumber: string
  contractDocuments: FileInfo[]
  prepaidBalance: string
  points: string
  memo: string
}

/** 폼 초기값 */
const initialForm: FormData = {
  email: '',
  name: '',
  phones: [{ label: '대표', number: '' }],
  companyId: '',
  entities: [],
  category: '',
  department: '',
  position: '',
  projectLink: '',
  fax: '',
  homepage: '',
  cashReceiptNumber: '',
  contractDocuments: [],
  prepaidBalance: '0',
  points: '0',
  memo: '',
}

export default function CustomerEditDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
  initialTab = 'info',
}: CustomerEditDialogProps) {
  // 탭 상태 (기본 정보 / 파일 관리)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [form, setForm] = useState<FormData>(initialForm)
  const [fullData, setFullData] = useState<FullCustomerData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 회사/수입사 생성·수정 다이얼로그 상태
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [companyEditTarget, setCompanyEditTarget] = useState<Record<string, unknown> | null>(null)
  const [importerDialogOpen, setImporterDialogOpen] = useState(false)
  const [importerEditTarget, setImporterEditTarget] = useState<Record<string, unknown> | null>(null)

  // 회사/수입사 생성 콜백
  const handleCreateEntity = useCallback((type: 'company' | 'importer') => {
    if (type === 'company') { setCompanyEditTarget(null); setCompanyDialogOpen(true) }
    else { setImporterEditTarget(null); setImporterDialogOpen(true) }
  }, [])

  // 회사/수입사 수정 콜백
  const handleEditEntity = useCallback(async (type: 'company' | 'importer', id: string) => {
    const supabase = getSupabase()
    if (type === 'company') {
      const { data } = await supabase.from('companies').select('*').eq('id', id).single()
      if (data) { setCompanyEditTarget(data as Record<string, unknown>); setCompanyDialogOpen(true) }
    } else {
      const { data } = await supabase.from('importers').select('*').eq('id', id).single()
      if (data) { setImporterEditTarget(data as Record<string, unknown>); setImporterDialogOpen(true) }
    }
  }, [])

  // 회사/수입사 다이얼로그 성공 후
  const handleEntitySuccess = useCallback(() => { invalidateEntityCache() }, [])

  /** DB에서 전체 고객 데이터 조회 */
  const loadData = useCallback(async () => {
    if (!customer?.id) return

    setIsLoading(true)
    setErrors({})

    try {
      const supabase = getSupabase()

      // 전체 고객 정보 조회 (회사 목록은 CompanySearchSelect 내부에서 처리)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, email, name, phones, company_id, customer_code, category, department, position, project_link, fax, homepage, cash_receipt_number, contract_documents, prepaid_balance, points, memo')
        .eq('id', customer.id)
        .single()

      if (customerError || !customerData) {
        setErrors({ general: '고객 정보를 불러올 수 없습니다.' })
        return
      }

      const data = customerData as FullCustomerData
      setFullData(data)

      // 연관 회사/수입사 조회
      const { data: entityLinks } = await supabase
        .from('customer_entities')
        .select('entity_type, entity_id')
        .eq('customer_id', customer.id)

      const loadedEntities: EntitySelection[] = (entityLinks || []).map(e => ({
        type: e.entity_type as 'company' | 'importer',
        id: e.entity_id,
      }))

      // 폼에 데이터 반영
      setForm({
        email: data.email || '',
        name: data.name || '',
        phones: Array.isArray(data.phones) && data.phones.length > 0
          ? data.phones
          : [{ label: '대표', number: '' }],
        companyId: data.company_id || '',
        entities: loadedEntities,
        category: data.category || '',
        department: data.department || '',
        position: data.position || '',
        projectLink: data.project_link || '',
        fax: data.fax || '',
        homepage: data.homepage || '',
        cashReceiptNumber: data.cash_receipt_number || '',
        contractDocuments: data.contract_documents || [],
        prepaidBalance: String(data.prepaid_balance ?? 0),
        points: String(data.points ?? 0),
        memo: data.memo || '',
      })
    } catch {
      setErrors({ general: '고객 정보를 불러오는 중 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }, [customer?.id])

  // 다이얼로그 열릴 때 데이터 로드
  useEffect(() => {
    if (open && customer) {
      loadData()
      setActiveTab(initialTab) // 탭 초기화 (파일 셀 클릭 시 'files' 탭으로)
    } else {
      // 다이얼로그 닫힐 때 초기화
      setForm(initialForm)
      setFullData(null)
      setErrors({})
      setActiveTab('info')
    }
  }, [open, customer, loadData, initialTab])

  /** 필드 업데이트 및 해당 에러 초기화 */
  const updateField = (field: keyof FormData, value: string | FileInfo[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  /** 연락처 항목 추가 */
  const addPhone = () => {
    setForm(prev => ({ ...prev, phones: [...prev.phones, { label: '대표', number: '' }] }))
  }

  /** 연락처 항목 삭제 */
  const removePhone = (idx: number) => {
    setForm(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== idx) }))
  }

  /** 연락처 라벨 변경 */
  const updatePhoneLabel = (idx: number, label: string) => {
    setForm(prev => ({
      ...prev,
      phones: prev.phones.map((p, i) => i === idx ? { ...p, label } : p),
    }))
  }

  /** 연락처 번호 변경 */
  const updatePhoneNumber = (idx: number, value: string) => {
    setForm(prev => ({
      ...prev,
      phones: prev.phones.map((p, i) => i === idx ? { ...p, number: value } : p),
    }))
  }

  /** 팩스 번호 포맷팅 */
  const handleFaxChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12)
    updateField('fax', digits)
  }

  /** 숫자 입력 처리 (잔액/포인트) */
  const handleNumberChange = (field: 'prepaidBalance' | 'points', value: string) => {
    // 숫자와 소수점만 허용
    const cleaned = value.replace(/[^\d.]/g, '')
    updateField(field, cleaned)
  }

  /** 폼 유효성 검증 */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    // 이메일 형식 간단 검증
    if (form.email.trim() && !isValidEmail(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /** 폼 제출 처리 */
  const handleSubmit = async () => {
    if (!validate() || !customer) return

    setIsSaving(true)
    setErrors({})

    try {
      // 이메일이 변경되었는지 확인
      const emailChanged = form.email.trim() !== (fullData?.email || '')

      // 이메일 변경 시 별도 API 호출
      if (emailChanged) {
        const res = await fetch('/api/admin/customers/update-email', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            newEmail: form.email.trim(),
          }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => null)
          setErrors({ general: `이메일 변경 실패: ${errorData?.error || res.statusText}` })
          return
        }
      }

      // 나머지 필드는 기존대로 supabase.update()
      const supabase = getSupabase()
      const filteredPhones = form.phones.filter(p => p.number.trim())

      const { error } = await supabase
        .from('customers')
        .update({
          name: form.name.trim(),
          phones: filteredPhones.length > 0 ? filteredPhones : null,
          company_id: form.companyId || null,
          category: form.category || null,
          department: form.department.trim() || null,
          position: form.position.trim() || null,
          project_link: form.projectLink.trim() || null,
          fax: form.fax || null,
          homepage: form.homepage.trim() || null,
          cash_receipt_number: form.cashReceiptNumber.trim() || null,
          contract_documents: form.contractDocuments.length > 0 ? form.contractDocuments : null,
          prepaid_balance: parseFloat(form.prepaidBalance) || 0,
          points: parseFloat(form.points) || 0,
          memo: form.memo.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)

      if (error) {
        setErrors({ general: `수정 실패: ${error.message}` })
        return
      }

      // 연관 회사/수입사 저장
      const entityRes = await fetch('/api/admin/customers/entities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, entities: form.entities }),
      })
      if (!entityRes.ok) {
        console.error('[CustomerEdit] 엔티티 저장 오류')
      }

      onSuccess()
      onOpenChange(false)
    } catch {
      setErrors({ general: '수정 중 오류가 발생했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  /** 공통 텍스트 영역 스타일 */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>고객 정보 수정</DialogTitle>
          <DialogDescription>
            {customer?.name || customer?.email || customer?.customer_code || '고객'} 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 에러 메시지 */}
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {/* 로딩 중 */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">정보 로딩 중...</span>
          </div>
        ) : fullData ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'files')} className="mt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                파일 관리
              </TabsTrigger>
            </TabsList>

            {/* ===== 기본 정보 탭 ===== */}
            <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 컬럼 1: 기본 정보 + 연락처 */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  기본 정보
                </h3>
                <div className="space-y-4">
                  {/* 고객 코드 (읽기 전용) */}
                  <div className="space-y-1.5">
                    <Label>고객 코드</Label>
                    <Input
                      value={fullData.customer_code || '-'}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-400">자동 생성된 고객 코드입니다.</p>
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email">이메일</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      autoComplete="off"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="example@email.com"
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  {/* 이름 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name">이름</Label>
                    <Input
                      id="edit-name"
                      autoComplete="off"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="홍길동"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  {/* 카테고리 */}
                  <div className="space-y-1.5">
                    <Label>카테고리</Label>
                    <PopoverSelect
                      id="category"
                      value={form.category || null}
                      onChange={(v) => updateField('category', v ?? '')}
                      options={CATEGORY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                      placeholder="선택하세요"
                      emptyLabel="선택 안함"
                    />
                  </div>
                </div>
              </section>

              {/* 연락처 */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-semibold text-gray-700">연락처</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={addPhone} className="h-7 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.phones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <LabelSelectPopover
                        currentLabel={phone.label}
                        onSelect={(v) => updatePhoneLabel(idx, v)}
                        tableName="phone_labels"
                        triggerWidth="w-[90px]"
                      />
                      <Input
                        autoComplete="off"
                        value={phone.number}
                        onChange={(e) => updatePhoneNumber(idx, e.target.value)}
                        placeholder="010-0000-0000"
                        className="flex-1"
                      />
                      {form.phones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhone(idx)}
                          className="h-9 w-9 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 컬럼 2: 소속 정보 + 추가 연락처 */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  소속 정보
                </h3>
                <div className="space-y-4">
                  {/* 소속 회사 */}
                  <div className="space-y-1.5">
                    <Label>소속 회사</Label>
                    <CompanySearchSelect
                      value={form.companyId}
                      onChange={(id) => updateField('companyId', id)}
                    />
                  </div>

                  {/* 연관 회사/수입사 */}
                  <div className="space-y-1.5">
                    <Label>연관 회사/수입사</Label>
                    <EntityMultiSearchSelect
                      value={form.entities}
                      onChange={(entities) => setForm(prev => ({ ...prev, entities }))}
                      excludeEntityIds={form.companyId ? [{ type: 'company', id: form.companyId }] : undefined}
                      onCreateEntity={handleCreateEntity}
                      onEditEntity={handleEditEntity}
                    />
                  </div>

                  {/* 부서 */}
                  <div className="space-y-1.5">
                    <Label>부서</Label>
                    <div className="border border-gray-200 rounded-lg px-2 py-1.5">
                      <SelectableOptionCell
                        value={form.department || null}
                        onSave={async (v) => updateField('department', v)}
                        tableName="customer_departments"
                        placeholder="부서 선택"
                      />
                    </div>
                  </div>

                  {/* 직책 */}
                  <div className="space-y-1.5">
                    <Label>직책</Label>
                    <div className="border border-gray-200 rounded-lg px-2 py-1.5">
                      <SelectableOptionCell
                        value={form.position || null}
                        onSave={async (v) => updateField('position', v)}
                        tableName="customer_positions"
                        placeholder="직책 선택"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 추가 연락처 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  추가 연락처
                </h3>
                <div className="space-y-4">
                  {/* 팩스 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-fax">팩스</Label>
                    <Input
                      id="edit-fax"
                      autoComplete="off"
                      value={form.fax}
                      onChange={(e) => handleFaxChange(e.target.value)}
                      placeholder="02-000-0000"
                    />
                  </div>

                  {/* 홈페이지 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-homepage">홈페이지</Label>
                    <Input
                      id="edit-homepage"
                      type="url"
                      autoComplete="off"
                      value={form.homepage}
                      onChange={(e) => updateField('homepage', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* 프로젝트 링크 */}
                  <div className="space-y-1.5">
                    <Label>프로젝트 링크</Label>
                    {form.projectLink ? (
                      // 링크가 있을 때: 클릭 가능한 링크로 표시
                      <div className="flex items-center gap-2">
                        <a
                          href={form.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-[#1a2867] hover:underline truncate flex-1 h-9 px-3 rounded-md border border-gray-200 bg-gray-50/50"
                        >
                          <Link2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{fullData?.customer_code || form.projectLink}</span>
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateField('projectLink', '')}
                          className="h-9 w-9 text-gray-400 hover:text-red-500 shrink-0"
                          title="링크 삭제"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      // 링크가 없을 때: 입력 필드 + Canva 생성 버튼
                      <div className="flex gap-2">
                        <Input
                          id="edit-projectLink"
                          type="url"
                          autoComplete="off"
                          value={form.projectLink}
                          onChange={(e) => updateField('projectLink', e.target.value)}
                          placeholder="https://project.example.com"
                          className="flex-1"
                        />
                        {customer && (
                          <CanvaProjectButton
                            customerId={customer.id}
                            onLinkCreated={(link) => updateField('projectLink', link)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* 컬럼 3: 재무 정보 + 계약 서류 + 메모 */}
            <div className="space-y-6">
              {/* 재무 정보 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  재무 정보
                </h3>
                <div className="space-y-4">
                  {/* 현금영수증 번호 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-cashReceiptNumber">현금영수증 번호</Label>
                    <Input
                      id="edit-cashReceiptNumber"
                      autoComplete="off"
                      value={form.cashReceiptNumber}
                      onChange={(e) => updateField('cashReceiptNumber', e.target.value)}
                      placeholder="현금영수증 발급 번호"
                    />
                  </div>

                  {/* 선불 잔액 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-prepaidBalance">선불 잔액</Label>
                    <Input
                      id="edit-prepaidBalance"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={form.prepaidBalance}
                      onChange={(e) => handleNumberChange('prepaidBalance', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* 포인트 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-points">포인트</Label>
                    <Input
                      id="edit-points"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={form.points}
                      onChange={(e) => handleNumberChange('points', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              {/* 파일 관리 바로가기 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  파일
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('files')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">파일 관리 탭에서 확인</span>
                  <span className="ml-auto text-xs text-gray-400">→</span>
                </button>
              </section>

              {/* 메모 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                  메모
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-memo">관리자 메모</Label>
                  <Textarea
                    id="edit-memo"
                    value={form.memo}
                    onChange={(e) => updateField('memo', e.target.value)}
                    placeholder="고객에 대한 메모..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </section>
            </div>
          </div>
            </TabsContent>

            {/* ===== 파일 관리 탭 ===== */}
            <TabsContent value="files" className="-mx-2">
              <CustomerFileManager
                customerId={fullData.id}
                customerName={fullData.name || ''}
                customerCode={fullData.customer_code || ''}
                compact={true}
              />
            </TabsContent>
          </Tabs>
        ) : null}

        {/* 푸터 버튼 (로딩 완료 후에만 표시) */}
        {!isLoading && fullData && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />저장 중...</>
              ) : '저장'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {/* 회사 생성/수정 다이얼로그 */}
      <CompanyFormDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        company={companyEditTarget as Parameters<typeof CompanyFormDialog>[0]['company']}
        onSuccess={handleEntitySuccess}
      />

      {/* 수입사 생성/수정 다이얼로그 */}
      <ImporterFormDialog
        open={importerDialogOpen}
        onOpenChange={setImporterDialogOpen}
        importer={importerEditTarget as Parameters<typeof ImporterFormDialog>[0]['importer']}
        onSuccess={handleEntitySuccess}
      />
    </Dialog>
  )
}
