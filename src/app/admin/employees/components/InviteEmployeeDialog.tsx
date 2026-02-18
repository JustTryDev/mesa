/**
 * 직원 초대 다이얼로그
 * Admin이 이메일로 새 직원을 초대 (연속 초대 지원)
 */
'use client'

import { useState, useRef } from 'react'
import { Mail, User, Shield, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PopoverSelect from '@/components/ui/PopoverSelect'
import { isValidEmail } from '@/lib/validation'

interface InviteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** 현재 로그인한 직원이 super_admin인지 여부 */
  isSuperAdmin: boolean
}

interface FormData {
  email: string
  name: string
  role: 'staff' | 'admin'
}

export default function InviteEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  isSuperAdmin,
}: InviteEmployeeDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    role: 'staff',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  // 초대 성공 이력 추적 (닫을 때 onSuccess 호출 여부 결정)
  const hasInvitedRef = useRef(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // 유효성 검사
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!isValidEmail(formData.email)) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '초대에 실패했습니다.')
        return
      }

      // 성공: 폼 초기화 + 성공 메시지 (다이얼로그는 유지)
      const invitedName = formData.name
      const invitedEmail = formData.email
      setFormData({ email: '', name: '', role: 'staff' })
      setSuccessMessage(`${invitedName} (${invitedEmail}) 초대 완료!`)
      hasInvitedRef.current = true
    } catch {
      setError('초대 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!isLoading) {
      // 닫을 때 초대 이력이 있으면 목록 새로고침
      if (!open && hasInvitedRef.current) {
        onSuccess()
        hasInvitedRef.current = false
      }
      setError(null)
      setSuccessMessage(null)
      setFormData({ email: '', name: '', role: 'staff' })
      onOpenChange(open)
    }
  }

  // 입력 시작하면 성공 메시지 숨기기
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (successMessage) setSuccessMessage(null)
    if (error) setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>직원 초대</DialogTitle>
          <DialogDescription>
            이메일로 초대 메일을 전송합니다. 초대된 직원은 가입 후 관리자 승인이 필요합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* 이름 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              이름
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="직원 이름"
              disabled={isLoading}
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              이메일
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="employee@company.com"
              disabled={isLoading}
            />
          </div>

          {/* 역할 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              역할
            </Label>
            <PopoverSelect
              id="role"
              value={formData.role}
              onChange={(v) =>
                setFormData(prev => ({ ...prev, role: (v ?? 'staff') as 'staff' | 'admin' }))
              }
              options={[
                { value: 'staff', label: 'Staff (일반 직원)' },
                ...(isSuperAdmin ? [{ value: 'admin', label: 'Admin (관리자)' }] : []),
              ]}
              placeholder="역할 선택"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              {formData.role === 'admin'
                ? 'Admin: 모든 메뉴 접근 + 직원 관리 가능'
                : 'Staff: 허용된 메뉴만 접근 가능 (권한 설정 필요)'}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              닫기
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  초대 중...
                </>
              ) : (
                '초대 메일 전송'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
