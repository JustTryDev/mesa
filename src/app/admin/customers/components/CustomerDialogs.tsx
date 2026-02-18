/**
 * 고객 페이지 다이얼로그 모음 컴포넌트
 *
 * 비유: 사무실의 "서랍장 모음"
 * 각각의 다이얼로그(서랍)가 특정 작업을 담당:
 * - 고객 등록 서랍
 * - 고객 수정 서랍
 * - 삭제 확인 서랍
 * - 파일 미리보기 서랍
 * - 회사/수입사 생성 서랍
 * - 이메일 변경 경고 서랍
 *
 * 왜 분리했나?
 * 다이얼로그 7개의 JSX가 page.tsx에 있으면 100줄이 넘음.
 * 이 파일로 모아두면 page.tsx가 깔끔해지고,
 * 다이얼로그 추가/수정 시 이 파일만 건드리면 됨
 */
'use client'

import { useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'
import FilePreviewDialog from '@/components/ui/FilePreviewDialog'
import CustomerCreateDialog from './CustomerCreateDialog'
import CustomerEditDialog from './CustomerEditDialog'
import { CompanyFormDialog } from '@/app/admin/companies/components'
import { ImporterFormDialog } from '@/app/admin/importers/components'
import type { FileInfo } from '@/components/ui/FileUpload'
import type { CustomerRow } from '../types'

interface CustomerDialogsProps {
  // 고객 등록 다이얼로그
  createDialogOpen: boolean
  onCreateDialogChange: (open: boolean) => void
  onCreateSuccess: () => void

  // 고객 수정 다이얼로그
  editDialogOpen: boolean
  onEditDialogChange: (open: boolean) => void
  editTarget: CustomerRow | null
  onEditSuccess: () => void
  editInitialTab: 'info' | 'files'

  // 삭제 확인 다이얼로그
  deleteTarget: CustomerRow | null
  onDeleteTargetChange: (target: CustomerRow | null) => void
  onDeleteConfirm: () => void
  isDeleting: boolean

  // 파일 미리보기 다이얼로그
  previewFile: FileInfo | null
  onPreviewFileChange: (file: FileInfo | null) => void

  // 회사 다이얼로그
  companyDialogOpen: boolean
  onCompanyDialogChange: (open: boolean) => void
  companyEditTarget: Record<string, unknown> | null
  onEntitySuccess: () => void

  // 수입사 다이얼로그
  importerDialogOpen: boolean
  onImporterDialogChange: (open: boolean) => void
  importerEditTarget: Record<string, unknown> | null

  // 인증 이메일 수정 경고
  emailWarningTarget: string | null
  emailWarningResolveRef: React.MutableRefObject<((allowed: boolean) => void) | null>
  onEmailWarningClose: () => void
}

export default function CustomerDialogs({
  createDialogOpen,
  onCreateDialogChange,
  onCreateSuccess,
  editDialogOpen,
  onEditDialogChange,
  editTarget,
  onEditSuccess,
  editInitialTab,
  deleteTarget,
  onDeleteTargetChange,
  onDeleteConfirm,
  isDeleting,
  previewFile,
  onPreviewFileChange,
  companyDialogOpen,
  onCompanyDialogChange,
  companyEditTarget,
  onEntitySuccess,
  importerDialogOpen,
  onImporterDialogChange,
  importerEditTarget,
  emailWarningTarget,
  emailWarningResolveRef,
  onEmailWarningClose,
}: CustomerDialogsProps) {
  return (
    <>
      {/* 고객 등록 다이얼로그 */}
      <CustomerCreateDialog
        open={createDialogOpen}
        onOpenChange={onCreateDialogChange}
        onSuccess={onCreateSuccess}
      />

      {/* 고객 수정 다이얼로그 (전체 편집 버튼 또는 행 클릭으로 열림) */}
      <CustomerEditDialog
        open={editDialogOpen}
        onOpenChange={onEditDialogChange}
        customer={editTarget}
        onSuccess={onEditSuccess}
        initialTab={editInitialTab}
      />

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => onDeleteTargetChange(null)}
        title="고객 완전 삭제"
        description={`${deleteTarget?.name || deleteTarget?.customer_code || ''}${deleteTarget?.email ? ` (${deleteTarget.email})` : ''} 고객을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 인증 계정과 모든 데이터가 영구 삭제됩니다.`}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* 파일 미리보기 다이얼로그 */}
      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => { if (!open) onPreviewFileChange(null) }}
        file={previewFile}
        bucketName="contract-documents"
      />

      {/* 회사 생성/수정 다이얼로그 */}
      <CompanyFormDialog
        open={companyDialogOpen}
        onOpenChange={onCompanyDialogChange}
        company={companyEditTarget as Parameters<typeof CompanyFormDialog>[0]['company']}
        onSuccess={onEntitySuccess}
      />

      {/* 수입사 생성/수정 다이얼로그 */}
      <ImporterFormDialog
        open={importerDialogOpen}
        onOpenChange={onImporterDialogChange}
        importer={importerEditTarget as Parameters<typeof ImporterFormDialog>[0]['importer']}
        onSuccess={onEntitySuccess}
      />

      {/* 인증 이메일 수정 경고 다이얼로그 */}
      <AlertDialog
        open={!!emailWarningTarget}
        onOpenChange={(open) => {
          if (!open) {
            emailWarningResolveRef.current?.(false)
            emailWarningResolveRef.current = null
            onEmailWarningClose()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              인증된 이메일 수정
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  이 이메일은 <span className="font-medium text-emerald-700">고객이 직접 가입하여 인증한 이메일</span>입니다.
                </p>
                <p>
                  이메일을 변경하면 해당 고객은 <span className="font-medium text-red-600">변경된 이메일로 로그인</span>해야 합니다.
                  반드시 고객에게 변경 사실을 알려주세요.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              emailWarningResolveRef.current?.(false)
              emailWarningResolveRef.current = null
              onEmailWarningClose()
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              emailWarningResolveRef.current?.(true)
              emailWarningResolveRef.current = null
              onEmailWarningClose()
            }}>
              이해했습니다, 수정하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
