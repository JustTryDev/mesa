/**
 * 관리자 고객 생성 다이얼로그
 * auth 계정 + customers 레코드를 함께 생성
 * 새로운 필드: category, department, position, projectLink, fax, homepage, cashReceiptNumber
 * customer_code는 DB에서 자동 생성, contract_documents는 수정 다이얼로그에서 업로드
 */
'use client'

import { useState, useEffect } from 'react'
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
import CompanySearchSelect from '@/components/ui/CompanySearchSelect'
import EntityMultiSearchSelect from '@/components/ui/EntityMultiSearchSelect'
import type { EntitySelection } from '@/components/ui/EntityMultiSearchSelect'
import SelectableOptionCell from '@/components/ui/SelectableOptionCell'
import LabelSelectPopover from '@/components/ui/LabelSelectPopover'
import { CompanyFormDialog } from '@/app/admin/companies/components'
import { ImporterFormDialog } from '@/app/admin/importers/components'
import { getSupabase } from '@/lib/supabase/client'
import { invalidateEntityCache } from '@/components/ui/EntityMultiSelectCell'
import { isValidEmail } from '@/lib/validation'
import type { PhoneEntry } from '@/types/common'

interface CustomerCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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
  memo: string
}

/** 폼 초기값 */
const initialForm: FormData = {
  email: '',
  name: '',
  phones: [{ label: '대표', number: '' }],
  companyId: '',
  entities: [],
  category: '고객',
  department: '',
  position: '',
  projectLink: '',
  fax: '',
  homepage: '',
  cashReceiptNumber: '',
  memo: '',
}

export default function CustomerCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomerCreateDialogProps) {
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // 회사/수입사 생성·수정 다이얼로그 상태
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [companyEditTarget, setCompanyEditTarget] = useState<Record<string, unknown> | null>(null)
  const [importerDialogOpen, setImporterDialogOpen] = useState(false)
  const [importerEditTarget, setImporterEditTarget] = useState<Record<string, unknown> | null>(null)

  // 다이얼로그 열릴 때 폼 초기화
  useEffect(() => {
    if (!open) return
    setForm(initialForm)
    setErrors({})
  }, [open])

  // 회사/수입사 생성 콜백
  const handleCreateEntity = (type: 'company' | 'importer') => {
    if (type === 'company') {
      setCompanyEditTarget(null)
      setCompanyDialogOpen(true)
    } else {
      setImporterEditTarget(null)
      setImporterDialogOpen(true)
    }
  }

  // 회사/수입사 수정 콜백
  const handleEditEntity = async (type: 'company' | 'importer', id: string) => {
    const supabase = getSupabase()
    if (type === 'company') {
      const { data } = await supabase.from('companies').select('*').eq('id', id).single()
      if (data) { setCompanyEditTarget(data as Record<string, unknown>); setCompanyDialogOpen(true) }
    } else {
      const { data } = await supabase.from('importers').select('*').eq('id', id).single()
      if (data) { setImporterEditTarget(data as Record<string, unknown>); setImporterDialogOpen(true) }
    }
  }

  // 회사/수입사 다이얼로그 성공 후
  const handleEntitySuccess = () => { invalidateEntityCache() }

  /** 필드 업데이트 및 해당 에러 초기화 */
  const updateField = (field: keyof FormData, value: string) => {
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

  /** 폼 유효성 검증 */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    // 이메일이 입력된 경우 포맷만 검증
    if (form.email.trim() && !isValidEmail(form.email)) {
      newErrors.email = '유효한 이메일을 입력해주세요.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /** 폼 제출 처리 */
  const handleSubmit = async () => {
    if (!validate()) return

    setIsSaving(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim() || undefined,
          name: form.name.trim() || undefined,
          phones: form.phones.filter(p => p.number.trim()),
          companyId: form.companyId || undefined,
          category: form.category || undefined,
          department: form.department.trim() || undefined,
          position: form.position.trim() || undefined,
          projectLink: form.projectLink.trim() || undefined,
          fax: form.fax || undefined,
          homepage: form.homepage.trim() || undefined,
          cashReceiptNumber: form.cashReceiptNumber.trim() || undefined,
          memo: form.memo.trim() || undefined,
          entities: form.entities.length > 0 ? form.entities : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors({ general: result.error || '고객 생성에 실패했습니다.' })
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch {
      setErrors({ general: '고객 생성 중 오류가 발생했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  /** 공통 텍스트 영역 스타일 */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>고객 등록</DialogTitle>
          <DialogDescription>
            이메일 없이도 고객 코드와 구분만으로 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 에러 메시지 */}
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* 컬럼 1: 기본 정보 + 연락처 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                기본 정보
              </h3>
              <div className="space-y-4">
                {/* 이메일 */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="customer@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* 이름 */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
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

          {/* 컬럼 2: 소속 정보 + 추가 연락처 + 기타 */}
          <div className="space-y-6">
            {/* 소속 정보 */}
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
                  <Label htmlFor="fax">팩스</Label>
                  <Input
                    id="fax"
                    autoComplete="off"
                    value={form.fax}
                    onChange={(e) => handleFaxChange(e.target.value)}
                    placeholder="02-000-0000"
                  />
                </div>

                {/* 홈페이지 */}
                <div className="space-y-1.5">
                  <Label htmlFor="homepage">홈페이지</Label>
                  <Input
                    id="homepage"
                    type="url"
                    autoComplete="off"
                    value={form.homepage}
                    onChange={(e) => updateField('homepage', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* 프로젝트 링크 */}
                <div className="space-y-1.5">
                  <Label htmlFor="projectLink">프로젝트 링크</Label>
                  <Input
                    id="projectLink"
                    type="url"
                    autoComplete="off"
                    value={form.projectLink}
                    onChange={(e) => updateField('projectLink', e.target.value)}
                    placeholder="https://project.example.com"
                  />
                </div>
              </div>
            </section>

            {/* 기타 정보 */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                기타 정보
              </h3>
              <div className="space-y-4">
                {/* 현금영수증 번호 */}
                <div className="space-y-1.5">
                  <Label htmlFor="cashReceiptNumber">현금영수증 번호</Label>
                  <Input
                    id="cashReceiptNumber"
                    autoComplete="off"
                    value={form.cashReceiptNumber}
                    onChange={(e) => updateField('cashReceiptNumber', e.target.value)}
                    placeholder="현금영수증 발급 번호"
                  />
                </div>

                {/* 메모 */}
                <div className="space-y-1.5">
                  <Label htmlFor="memo">메모</Label>
                  <Textarea
                    id="memo"
                    value={form.memo}
                    onChange={(e) => updateField('memo', e.target.value)}
                    placeholder="고객에 대한 메모..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />등록 중...</>
            ) : '등록'}
          </Button>
        </DialogFooter>
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
