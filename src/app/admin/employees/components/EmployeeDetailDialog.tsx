/**
 * 직원 상세 정보 다이얼로그
 *
 * 직원의 기본 정보, 역할, 권한 등을 조회하는 읽기 전용 다이얼로그
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Tag,
  Calendar,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDateDot } from '@/lib/format'
import type { PhoneEntry } from '@/types/common'

// 직원 데이터 타입
interface EmployeeRow {
  id: string
  email: string
  name: string
  phones: PhoneEntry[] | null
  department: string | null
  position: string | null
  role: 'super_admin' | 'admin' | 'staff'
  is_active: boolean
  assigned_brands: string[]
  created_at: string
  updated_at: string
}

// 역할 설정
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', icon: ShieldAlert },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: ShieldCheck },
  staff: { label: 'Staff', color: 'bg-gray-100 text-gray-700', icon: Shield },
}

// 메뉴 접근 권한 타입
interface MenuPermission {
  menu_id: string
  menu_label: string
}

interface EmployeeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeRow | null
}

export default function EmployeeDetailDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDetailDialogProps) {
  const [permissions, setPermissions] = useState<MenuPermission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // staff 역할일 때 메뉴 접근 권한 로드
  const fetchPermissions = useCallback(async () => {
    if (!employee || employee.role !== 'staff') return

    setLoadingPermissions(true)
    try {
      const res = await fetch(`/api/admin/employees/permissions?employeeId=${employee.id}`)
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions || [])
      }
    } catch (err) {
      console.error('[직원 상세] 권한 로드 실패:', err)
    } finally {
      setLoadingPermissions(false)
    }
  }, [employee])

  useEffect(() => {
    if (open && employee?.role === 'staff') {
      fetchPermissions()
    } else {
      setPermissions([])
    }
  }, [open, employee, fetchPermissions])

  if (!employee) return null

  const roleConfig = ROLE_CONFIG[employee.role] || ROLE_CONFIG.staff
  const RoleIcon = roleConfig.icon
  const phones: PhoneEntry[] = Array.isArray(employee.phones) ? employee.phones : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            직원 상세 정보
            {employee.is_active ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-0 ml-2">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                활성
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0 ml-2">
                <XCircle className="w-3 h-3 mr-1" />
                비활성
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 기본 정보 */}
          <div className="space-y-3">
            {/* 이름 & 역할 */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
              <Badge variant="outline" className={`${roleConfig.color} border-0`}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {roleConfig.label}
              </Badge>
            </div>

            {/* 이메일 */}
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{employee.email}</span>
            </div>

            {/* 전화번호 */}
            {phones.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {phones.map((p, i) => (
                    <div key={i} className="text-gray-700">
                      <span className="text-gray-400 text-xs mr-1">{p.label}</span>
                      {p.number}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 부서 */}
            {employee.department && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{employee.department}</span>
              </div>
            )}

            {/* 직급 */}
            {employee.position && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{employee.position}</span>
              </div>
            )}

            {/* 담당 브랜드 */}
            {employee.assigned_brands && employee.assigned_brands.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <Tag className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {employee.assigned_brands.map((brand) => (
                    <Badge key={brand} variant="secondary" className="text-xs">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 날짜 정보 */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="text-gray-500">
                <span>가입일: {employee.created_at ? formatDateDot(new Date(employee.created_at)) : '-'}</span>
                <span className="mx-2">|</span>
                <span>수정일: {employee.updated_at ? formatDateDot(new Date(employee.updated_at)) : '-'}</span>
              </div>
            </div>
          </div>

          {/* Staff 메뉴 접근 권한 */}
          {employee.role === 'staff' && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">메뉴 접근 권한</h4>
              </div>
              {loadingPermissions ? (
                <div className="text-sm text-gray-400">권한 정보 로드 중...</div>
              ) : permissions.length === 0 ? (
                <div className="text-sm text-gray-400">설정된 권한이 없습니다.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {permissions.map((perm) => (
                    <Badge key={perm.menu_id} variant="outline" className="text-xs">
                      {perm.menu_label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
