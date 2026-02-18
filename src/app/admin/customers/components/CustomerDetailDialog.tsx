/**
 * 고객 상세 정보 다이얼로그
 * 고객 정보 조회 + 메모 수정
 * 새로운 필드: customer_code, category, department, position, project_link, fax, homepage,
 *             cash_receipt_number, contract_documents, prepaid_balance, points
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Building2, Phone, Mail, Calendar, Loader2, Save,
  Tag, Briefcase, Globe, FileText, Download, Link2, Wallet, Star, Hash, Printer, Ship,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatDateDot, formatPrice, formatFileSize } from '@/lib/format'
import type { FileInfo } from '@/components/ui/FileUpload'
import ProjectLinkCell from './ProjectLinkCell'
import { useImageLightbox } from '@/hooks/useImageLightbox'
import type { PhoneEntry } from '@/types/common'

// 이미지 파일 여부 판단 — 확장자 기반
const isImageFile = (name: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)

/** 연관 엔티티 표시 타입 */
interface EntityDisplay {
  type: 'company' | 'importer'
  id: string
  name: string
  code: string
}

/** 회사 정보 타입 */
interface Company {
  id: string
  name: string
  business_number: string | null
  tax_type: string | null
}

/** 카테고리 라벨 매핑 */
const CATEGORY_LABELS: Record<string, string> = {
  customer: '고객',
  supplier: '공급사',
}

/** 고객 상세 정보 타입 (DB 스키마 반영) */
interface CustomerDetail {
  id: string
  email: string
  name: string
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
  updated_at: string
  companies: Company | null
  entities?: EntityDisplay[]
}

interface CustomerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string | null
  onUpdate: () => void
}

export default function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  onUpdate,
}: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이미지 라이트박스 훅 — Dialog 안에서도 안전하게 이미지를 크게 볼 수 있게 해줌
  const { openLightbox, LightboxPortal, preventDialogClose } = useImageLightbox()

  // 고객 상세 정보 로드
  const loadCustomer = useCallback(async () => {
    if (!customerId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*, companies(*)')
        .eq('id', customerId)
        .single()

      if (fetchError) {
        setError('고객 정보를 불러올 수 없습니다.')
        return
      }

      const customerData = data as CustomerDetail

      // 연관 회사/수입사 조회
      const { data: entityLinks } = await supabase
        .from('customer_entities')
        .select('entity_type, entity_id')
        .eq('customer_id', customerId)

      if (entityLinks && entityLinks.length > 0) {
        const companyIds = [...new Set(entityLinks.filter(l => l.entity_type === 'company').map(l => l.entity_id))]
        const importerIds = [...new Set(entityLinks.filter(l => l.entity_type === 'importer').map(l => l.entity_id))]

        const [companiesRes, importersRes] = await Promise.all([
          companyIds.length > 0
            ? supabase.from('companies').select('id, name, company_code').in('id', companyIds)
            : Promise.resolve({ data: [] }),
          importerIds.length > 0
            ? supabase.from('importers').select('id, name, importer_code').in('id', importerIds)
            : Promise.resolve({ data: [] }),
        ])

        const companiesMap = new Map((companiesRes.data || []).map(c => [c.id, c]))
        const importersMap = new Map((importersRes.data || []).map(i => [i.id, i]))

        customerData.entities = entityLinks
          .map(link => {
            if (link.entity_type === 'company') {
              const c = companiesMap.get(link.entity_id)
              if (!c) return null
              return { type: 'company' as const, id: link.entity_id, code: c.company_code, name: c.name }
            } else {
              const i = importersMap.get(link.entity_id)
              if (!i) return null
              return { type: 'importer' as const, id: link.entity_id, code: i.importer_code, name: i.name }
            }
          })
          .filter((e): e is EntityDisplay => e !== null)
      }

      setCustomer(customerData)
      setMemo(customerData.memo || '')
    } catch {
      setError('고객 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    if (open && customerId) {
      loadCustomer()
    }
  }, [open, customerId, loadCustomer])

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!customerId) return

    setIsSaving(true)
    setError(null)

    try {
      const supabase = getSupabase()
      const { error: updateError } = await supabase
        .from('customers')
        .update({ memo, updated_at: new Date().toISOString() })
        .eq('id', customerId)

      if (updateError) {
        setError(`메모 저장 실패: ${updateError.message}`)
        return
      }

      onUpdate()
    } catch {
      setError('메모 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // Supabase Storage에서 서명된 URL 생성 (60초 유효)
  // 비유: 도서관 사서에게 "이 파일 잠깐 꺼내줘" 요청하는 것
  const createSignedUrl = async (file: FileInfo): Promise<string | null> => {
    const supabase = getSupabase()
    const { data, error: urlError } = await supabase.storage
      .from('contract-documents')
      .createSignedUrl(file.path, 60)

    if (urlError || !data?.signedUrl) {
      setError('링크 생성에 실패했습니다.')
      return null
    }
    return data.signedUrl
  }

  // 계약 서류 다운로드
  const handleFileDownload = async (file: FileInfo) => {
    const url = await createSignedUrl(file)
    if (!url) return
    window.open(url, '_blank')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={preventDialogClose}
        onInteractOutside={preventDialogClose}
      >
        <DialogHeader>
          <DialogTitle>고객 상세 정보</DialogTitle>
          <DialogDescription>
            고객의 상세 정보를 확인하고 메모를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">정보 로딩 중...</span>
          </div>
        ) : customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {/* 컬럼 1: 기본 정보 */}
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">기본 정보</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <InfoRow icon={Hash} label="고객 코드" value={customer.customer_code || '-'} />
                  <InfoRow icon={User} label="이름" value={customer.name} />
                  <InfoRow icon={Mail} label="이메일" value={customer.email} />
                  {/* 연락처 (다중) */}
                  {Array.isArray(customer.phones) && customer.phones.length > 0 ? (
                    customer.phones.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Phone className="w-3.5 h-3.5" />
                          {p.label}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{p.number}</span>
                      </div>
                    ))
                  ) : (
                    <InfoRow icon={Phone} label="연락처" value="-" />
                  )}
                  {/* 카테고리 */}
                  {customer.category && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Tag className="w-3.5 h-3.5" />
                        카테고리
                      </span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                        {CATEGORY_LABELS[customer.category] || customer.category}
                      </Badge>
                    </div>
                  )}
                  <InfoRow
                    icon={Calendar}
                    label="최근 수정일"
                    value={customer.updated_at ? formatDateDot(new Date(customer.updated_at)) : '-'}
                  />
                </div>
              </div>
            </div>

            {/* 컬럼 2: 소속 정보 + 추가 연락처 */}
            <div className="space-y-5">
              {/* 소속 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">소속 정보</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {customer.companies ? (
                    <>
                      <InfoRow icon={Building2} label="회사명" value={customer.companies.name} />
                      <InfoRow
                        icon={Building2}
                        label="사업자번호"
                        value={customer.companies.business_number || '-'}
                      />
                      <InfoRow
                        icon={Building2}
                        label="과세유형"
                        value={customer.companies.tax_type || '-'}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-1">소속 회사 없음 (개인 고객)</p>
                  )}
                  <InfoRow icon={Briefcase} label="부서" value={customer.department || '-'} />
                  <InfoRow icon={Briefcase} label="직책" value={customer.position || '-'} />
                </div>
              </div>

              {/* 연관 회사/수입사 */}
              {customer.entities && customer.entities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">연관 회사/수입사</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {customer.entities.map(e => (
                        <Badge
                          key={`${e.type}-${e.id}`}
                          variant="outline"
                          className={cn(
                            'text-xs px-1.5 py-0.5 gap-1 font-normal',
                            e.type === 'company'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          )}
                        >
                          {e.type === 'company'
                            ? <Building2 className="w-3 h-3" />
                            : <Ship className="w-3 h-3" />
                          }
                          <span className="font-mono text-[10px] opacity-60">{e.code}</span>
                          {e.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 추가 연락처 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">추가 연락처</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <InfoRow icon={Printer} label="팩스" value={customer.fax || '-'} />
                  {customer.homepage ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Globe className="w-3.5 h-3.5" />
                        홈페이지
                      </span>
                      <a
                        href={customer.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#1a2867] hover:underline truncate max-w-[200px]"
                      >
                        {customer.homepage}
                      </a>
                    </div>
                  ) : (
                    <InfoRow icon={Globe} label="홈페이지" value="-" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Link2 className="w-3.5 h-3.5" />
                      프로젝트 링크
                    </span>
                    <ProjectLinkCell
                      customerId={customer.id}
                      customerCode={customer.customer_code}
                      projectLink={customer.project_link}
                      onLinkUpdate={(newLink) => {
                        // 상세보기 내부에서 링크가 생성되면 로컬 상태 업데이트
                        setCustomer(prev => prev ? { ...prev, project_link: newLink } : prev)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 컬럼 3: 재무 정보 + 계약 서류 + 메모 */}
            <div className="space-y-5">
              {/* 재무 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">재무 정보</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <InfoRow
                    icon={Hash}
                    label="현금영수증 번호"
                    value={customer.cash_receipt_number || '-'}
                  />
                  <InfoRow
                    icon={Wallet}
                    label="선불 잔액"
                    value={formatPrice(customer.prepaid_balance ?? 0)}
                  />
                  <InfoRow
                    icon={Star}
                    label="포인트"
                    value={formatPrice(customer.points ?? 0, { showUnit: false }) + 'P'}
                  />
                </div>
              </div>

              {/* 계약 서류 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">계약 서류</h3>
                {customer.contract_documents && customer.contract_documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {customer.contract_documents.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      >
                        {/* 이미지 파일이면 클릭 가능한 아이콘 버튼, 아니면 일반 파일 아이콘 */}
                        {isImageFile(file.name) ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const url = await createSignedUrl(file)
                              if (url) openLightbox(url, file.name)
                            }}
                            className="w-8 h-8 rounded border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:border-blue-300 bg-gray-100 flex items-center justify-center"
                            title="이미지 크게 보기"
                          >
                            <FileText className="h-4 w-4 text-blue-400" />
                          </button>
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                        {/* 이미지 파일은 파일명도 클릭하면 라이트박스 열림 */}
                        {isImageFile(file.name) ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const url = await createSignedUrl(file)
                              if (url) openLightbox(url, file.name)
                            }}
                            className="flex-1 truncate text-blue-600 hover:underline text-left"
                            title="이미지 크게 보기"
                          >
                            {file.name}
                          </button>
                        ) : (
                          <span className="flex-1 truncate text-gray-700">{file.name}</span>
                        )}
                        <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => handleFileDownload(file)}
                          className="text-gray-400 hover:text-[#1a2867] transition-colors"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">등록된 서류가 없습니다.</p>
                )}
              </div>

              {/* 메모 */}
              <div className="space-y-3">
                <Label htmlFor="detail-memo" className="text-sm font-medium text-gray-500">관리자 메모</Label>
                <Textarea
                  id="detail-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="고객에 대한 메모를 입력하세요..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveMemo}
                    disabled={isSaving || memo === (customer.memo || '')}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1" />
                        메모 저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    {/* 라이트박스: Dialog 밖에서 body에 직접 렌더링됨 */}
    {LightboxPortal}
    </>
  )
}

/** 정보 행 컴포넌트 */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
