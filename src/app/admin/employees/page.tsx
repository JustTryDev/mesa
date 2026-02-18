/**
 * 직원 관리 페이지
 * 직원 목록 조회, 초대, 승인/비활성화, 역할 변경, 권한 설정
 * 인라인 편집: 이름, 연락처, 부서, 직급, 담당 브랜드
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  KeyRound,
  Send,
  Eye,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'
import { getSupabase } from '@/lib/supabase/client'
import { formatDateDot } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import InlineEditCell from '@/components/ui/InlineEditCell'
import ContactInlineEditCell, { ContactEntry } from '@/components/ui/ContactInlineEditCell'
import { InviteEmployeeDialog, EmployeePermissionDialog, EmployeeDetailDialog, SelectableOptionCell } from './components'
import MasterMultiSelectCell from '@/components/ui/MasterMultiSelectCell'
import useTableSettings, { type ColumnDef } from '@/hooks/useTableSettings'
import ColumnVisibilityPopover from '@/components/ui/ColumnVisibilityPopover'
import { useFloatingScrollbar } from '@/hooks/useFloatingScrollbar'
import { FloatingScrollbar } from '@/components/ui/FloatingScrollbar'
import CompactPagination from '@/components/ui/CompactPagination'
import type { PhoneEntry } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination'

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

// 역할 라벨 & 색상
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', icon: ShieldAlert },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: ShieldCheck },
  staff: { label: 'Staff', color: 'bg-gray-100 text-gray-700', icon: Shield },
}

// 테이블 칼럼 정의
const COLUMNS: ColumnDef[] = [
  { key: 'employee', label: '직원' },
  { key: 'phones', label: '연락처' },
  { key: 'department', label: '부서' },
  { key: 'position', label: '직급' },
  { key: 'brands', label: '담당 브랜드' },
  { key: 'role', label: '역할' },
  { key: 'status', label: '상태', align: 'center' },
  { key: 'created_at', label: '입사일' },
  { key: 'actions', label: '관리', align: 'center', sticky: true },
]

const DEFAULT_WIDTHS: Record<string, number> = {
  employee: 200,
  phones: 140,
  department: 90,
  position: 90,
  brands: 160,
  role: 110,
  status: 80,
  created_at: 100,
  actions: 120,
}

// 페이지당 표시 항목 수 (중앙 관리 상수 사용)
const PAGE_SIZE = DEFAULT_PAGE_SIZE

export default function EmployeesPage() {
  const { isSuperAdmin, isAdmin, employee: currentEmployee, user } = useAuth()
  const queryClient = useQueryClient()

  // 필터/검색
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 로컬 데이터 (인라인 편집 즉시 반영용)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])

  // 다이얼로그 상태
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [permissionTarget, setPermissionTarget] = useState<{
    id: string
    name: string
    role: string
  } | null>(null)

  // 상세 보기 상태
  const [detailTarget, setDetailTarget] = useState<EmployeeRow | null>(null)

  // 액션 상태
  const [actionTarget, setActionTarget] = useState<{
    employee: EmployeeRow
    action: 'activate' | 'deactivate' | 'changeRole'
    newRole?: string
  } | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  // 비밀번호 리셋 상태
  const [resetTarget, setResetTarget] = useState<EmployeeRow | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // 초대 재전송 상태
  const [resendingId, setResendingId] = useState<string | null>(null)

  // 테이블 설정 (칼럼 너비/순서/숨기기 + DB 저장)
  const tableSettings = useTableSettings({
    pageId: 'employees',
    columns: COLUMNS,
    defaultWidths: DEFAULT_WIDTHS,
    userId: user?.id,
    requiredColumns: ['employee', 'actions'],
  })

  /**
   * ─── 직원 목록 조회 (useQuery) ───
   *
   * 비유: 기존 useEffect + fetch는 "매번 직접 서류함을 뒤지는 것"
   *       useQuery는 "비서가 알아서 관리해주고, 바뀌면 알려주는 것"
   *
   * queryKey에 필터가 포함되어 있어서 검색/역할/상태/페이지가 바뀌면 자동 재조회
   */
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['admin-employees', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () => {
      const supabase = getSupabase()
      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
      }
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) {
        console.error('[Employees] 조회 오류:', error)
        return { employees: [], total: 0 }
      }
      return { employees: (data as EmployeeRow[]) || [], total: count || 0 }
    },
  })

  // useQuery 데이터를 로컬 상태에 동기화 (인라인 편집 즉시 반영 위해)
  useEffect(() => {
    if (employeesData) setEmployees(employeesData.employees)
  }, [employeesData])

  const total = employeesData?.total || 0

  // 플로팅 스크롤바 (테이블 가로 스크롤 연동)
  const { scrollContainerRef, floatingScrollRef, tableScrollWidth } = useFloatingScrollbar(isLoading)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  /** CRUD 후 캐시 무효화 — 기존의 invalidateEmployees() 대체 */
  const invalidateEmployees = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-employees'] })
  }, [queryClient])

  // 검색/필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter, statusFilter])

  // 텍스트 필드 인라인 저장 (이름, 연락처, 부서, 직급)
  const handleInlineSave = useCallback(async (
    employeeId: string,
    field: string,
    value: string
  ) => {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('employees')
      .update({ [field]: value || null, updated_at: new Date().toISOString() })
      .eq('id', employeeId)

    if (error) throw error

    // 로컬 상태 즉시 반영
    setEmployees(prev => prev.map(e =>
      e.id === employeeId ? { ...e, [field]: value || null } : e
    ))
  }, [])

  // 연락처(phones) 저장
  const handlePhonesSave = useCallback(async (
    employeeId: string,
    entries: ContactEntry[]
  ) => {
    const phones = entries.map(e => ({ label: e.label, number: e.value }))
    const supabase = getSupabase()
    const { error } = await supabase
      .from('employees')
      .update({ phones: phones.length > 0 ? phones : null, updated_at: new Date().toISOString() })
      .eq('id', employeeId)

    if (error) throw error

    // 로컬 상태 즉시 반영
    setEmployees(prev => prev.map(e =>
      e.id === employeeId ? { ...e, phones: phones.length > 0 ? phones : null } : e
    ))
  }, [])

  // 브랜드 배열 저장
  const handleBrandsSave = useCallback(async (
    employeeId: string,
    brands: string[]
  ) => {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('employees')
      .update({ assigned_brands: brands, updated_at: new Date().toISOString() })
      .eq('id', employeeId)

    if (error) throw error

    // 로컬 상태 즉시 반영
    setEmployees(prev => prev.map(e =>
      e.id === employeeId ? { ...e, assigned_brands: brands } : e
    ))
  }, [])

  // 직원 활성화/비활성화
  const handleToggleActive = async () => {
    if (!actionTarget) return

    setIsActioning(true)
    try {
      const supabase = getSupabase()
      const rpcName = actionTarget.action === 'activate'
        ? 'activate_employee'
        : 'deactivate_employee'

      const { error } = await supabase.rpc(rpcName, {
        target_employee_id: actionTarget.employee.id,
      })

      if (error) {
        toast.error(`오류: ${error.message}`)
        return
      }

      // 목록 새로고침
      await invalidateEmployees()
    } catch {
      toast.error('작업 중 오류가 발생했습니다.')
    } finally {
      setIsActioning(false)
      setActionTarget(null)
    }
  }

  // 역할 변경 (super_admin 전용)
  const handleChangeRole = async () => {
    if (!actionTarget || !actionTarget.newRole) return

    setIsActioning(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('employees')
        .update({ role: actionTarget.newRole, updated_at: new Date().toISOString() })
        .eq('id', actionTarget.employee.id)

      if (error) {
        toast.error(`역할 변경 실패: ${error.message}`)
        return
      }

      await invalidateEmployees()
    } catch {
      toast.error('역할 변경 중 오류가 발생했습니다.')
    } finally {
      setIsActioning(false)
      setActionTarget(null)
    }
  }

  // 비밀번호 리셋
  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword) return

    if (resetPassword.length < 8) {
      setResetError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setIsResetting(true)
    setResetError(null)
    try {
      const res = await fetch('/api/admin/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: resetTarget.id,
          newPassword: resetPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setResetError(data.error || '비밀번호 변경에 실패했습니다.')
        return
      }

      toast.success(`${resetTarget.name}님의 비밀번호가 변경되었습니다.`)
      setResetTarget(null)
      setResetPassword('')
    } catch {
      setResetError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsResetting(false)
    }
  }

  // 초대 재전송
  const handleResendInvite = async (emp: EmployeeRow) => {
    if (resendingId) return
    setResendingId(emp.id)
    try {
      const res = await fetch('/api/admin/employees/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: emp.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '초대 재전송에 실패했습니다.')
        return
      }
      toast.success(`${emp.name}님에게 초대 메일을 다시 전송했습니다.`)
    } catch {
      toast.error('초대 재전송 중 오류가 발생했습니다.')
    } finally {
      setResendingId(null)
    }
  }

  // 권한 설정 열기
  const openPermissionDialog = (emp: EmployeeRow) => {
    setPermissionTarget({ id: emp.id, name: emp.name, role: emp.role })
    setPermissionDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">직원 관리</h1>
            <p className="text-sm text-gray-500">총 {total}명</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              직원 초대
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={invalidateEmployees}
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <ColumnVisibilityPopover
            columns={tableSettings.orderedColumns}
            hiddenColumns={tableSettings.hiddenColumns}
            requiredColumns={tableSettings.requiredColumns}
            onToggle={tableSettings.toggleColumnVisibility}
            onShowAll={tableSettings.showAllColumns}
          />
          <Button variant="ghost" size="sm" onClick={tableSettings.resetSettings} title="컬럼 설정 초기화">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="pl-9"
            />
          </div>

          {/* 역할 필터 */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="역할" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 역할</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>

          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all'
              ? '검색 결과가 없습니다.'
              : '등록된 직원이 없습니다.'}
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-auto scrollbar-hide bg-white rounded-xl border border-gray-200"
        >
            <table className="w-full table-fixed" style={{ minWidth: tableSettings.totalWidth }}>
              {/* 테이블 헤더 */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                  {tableSettings.visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: tableSettings.columnWidths[col.key], minWidth: 60 }}
                      className={`px-4 py-3 font-medium relative select-none text-center ${
                        !col.sticky ? 'cursor-grab' : ''
                      } ${
                        tableSettings.dragOverColumn === col.key ? 'bg-blue-50' : ''
                      }`}
                      draggable={!col.sticky}
                      onDragStart={() => tableSettings.handleDragStart(col.key)}
                      onDragOver={(e) => tableSettings.handleDragOver(e, col.key)}
                      onDrop={() => tableSettings.handleDrop(col.key)}
                      onDragEnd={tableSettings.handleDragEnd}
                    >
                      {col.label}
                      {/* 리사이즈 핸들 */}
                      <div
                        className="absolute top-0 -right-1.5 h-full w-3 cursor-col-resize z-10 group/resize"
                        onMouseDown={(e) => tableSettings.handleResizeMouseDown(e, col.key)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="absolute right-[5px] top-0 h-full w-px bg-gray-200 group-hover/resize:w-0.5 group-hover/resize:bg-blue-400 transition-all" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* 테이블 바디 */}
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => {
                  const roleConfig = ROLE_CONFIG[emp.role]
                  const RoleIcon = roleConfig.icon
                  const isCurrentUser = emp.id === currentEmployee?.id

                  // 셀 렌더러 맵
                  const cellRenderers: Record<string, React.ReactNode> = {
                    employee: (
                      <td key="employee" style={{ width: tableSettings.columnWidths['employee'] }} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">{emp.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <InlineEditCell
                                value={emp.name}
                                onSave={(v) => handleInlineSave(emp.id, 'name', v)}
                                placeholder="이름"
                                className="font-medium text-gray-900"
                              />
                              {isCurrentUser && (
                                <span className="text-xs text-blue-500 flex-shrink-0">(나)</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                    ),
                    phones: (
                      <td key="phones" style={{ width: tableSettings.columnWidths['phones'] }} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ContactInlineEditCell
                          entries={(emp.phones || []).map(p => ({ label: p.label, value: p.number }))}
                          onSave={(entries) => handlePhonesSave(emp.id, entries)}
                          labelTableName="phone_labels"
                          inputPlaceholder="02-1234-5678"
                          typeLabel="연락처"
                        />
                      </td>
                    ),
                    department: (
                      <td key="department" style={{ width: tableSettings.columnWidths['department'] }} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <SelectableOptionCell
                          value={emp.department}
                          onSave={(v) => handleInlineSave(emp.id, 'department', v)}
                          tableName="departments"
                          placeholder="-"
                          className="text-sm text-gray-600"
                        />
                      </td>
                    ),
                    position: (
                      <td key="position" style={{ width: tableSettings.columnWidths['position'] }} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <SelectableOptionCell
                          value={emp.position}
                          onSave={(v) => handleInlineSave(emp.id, 'position', v)}
                          tableName="positions"
                          placeholder="-"
                          className="text-sm text-gray-600"
                        />
                      </td>
                    ),
                    brands: (
                      <td key="brands" style={{ width: tableSettings.columnWidths['brands'] }} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <MasterMultiSelectCell
                          value={emp.assigned_brands || []}
                          onSave={(brands) => handleBrandsSave(emp.id, brands)}
                          tableName="brands"
                          addPlaceholder="새 브랜드..."
                        />
                      </td>
                    ),
                    role: (
                      <td key="role" style={{ width: tableSettings.columnWidths['role'] }} className="px-4 py-3">
                        <Badge variant="outline" className={`${roleConfig.color} border-0`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleConfig.label}
                        </Badge>
                      </td>
                    ),
                    status: (
                      <td key="status" style={{ width: tableSettings.columnWidths['status'] }} className="px-4 py-3">
                        {emp.is_active ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            활성
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-0">
                            <XCircle className="w-3 h-3 mr-1" />
                            비활성
                          </Badge>
                        )}
                      </td>
                    ),
                    created_at: (
                      <td key="created_at" style={{ width: tableSettings.columnWidths['created_at'] }} className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {emp.created_at ? formatDateDot(new Date(emp.created_at)) : '-'}
                        </span>
                      </td>
                    ),
                    actions: (
                      <td key="actions" style={{ width: tableSettings.columnWidths['actions'] }} className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); setDetailTarget(emp) }}
                            title="상세 보기">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {!isCurrentUser && isAdmin && (
                            <>
                              {!emp.is_active ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => setActionTarget({ employee: emp, action: 'activate' })}
                                    title="승인"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    승인
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => handleResendInvite(emp)}
                                    disabled={resendingId === emp.id}
                                    title="초대 재전송"
                                  >
                                    {resendingId === emp.id ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    재전송
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setActionTarget({ employee: emp, action: 'deactivate' })}
                                  title="비활성화"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  비활성
                                </Button>
                              )}
                              {emp.role === 'staff' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => openPermissionDialog(emp)}
                                  title="권한 설정"
                                >
                                  <Shield className="w-3.5 h-3.5 mr-1" />
                                  권한
                                </Button>
                              )}
                              {isAdmin && emp.role !== 'super_admin' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100" title="더보기">
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setResetTarget(emp); setResetPassword(''); setResetError(null) }}>
                                      <KeyRound className="w-4 h-4 mr-2 text-orange-600" />
                                      비밀번호 리셋
                                    </DropdownMenuItem>
                                    {isSuperAdmin && emp.role !== 'admin' && (
                                      <DropdownMenuItem onClick={() => setActionTarget({ employee: emp, action: 'changeRole', newRole: 'admin' })}>
                                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                                        Admin으로 변경
                                      </DropdownMenuItem>
                                    )}
                                    {isSuperAdmin && emp.role !== 'staff' && (
                                      <DropdownMenuItem onClick={() => setActionTarget({ employee: emp, action: 'changeRole', newRole: 'staff' })}>
                                        <Shield className="w-4 h-4 mr-2 text-gray-600" />
                                        Staff로 변경
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    ),
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setDetailTarget(emp)}>
                      {tableSettings.visibleColumns.map(col => cellRenderers[col.key])}
                    </tr>
                  )
                })}
              </tbody>
            </table>
        </div>
      )}

      <FloatingScrollbar scrollRef={floatingScrollRef} width={tableScrollWidth} />
      <CompactPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* 직원 초대 다이얼로그 */}
      <InviteEmployeeDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={invalidateEmployees}
        isSuperAdmin={isSuperAdmin}
      />

      {/* 직원 상세 다이얼로그 */}
      <EmployeeDetailDialog
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        employee={detailTarget}
      />

      {/* 권한 설정 다이얼로그 */}
      <EmployeePermissionDialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
        employee={permissionTarget}
      />

      {/* 승인/비활성화 확인 다이얼로그 */}
      <AlertDialog
        open={!!actionTarget && actionTarget.action !== 'changeRole'}
        onOpenChange={() => setActionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.action === 'activate' ? '직원 승인' : '직원 비활성화'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-gray-900">
                {actionTarget?.employee.name}
              </span>
              님을{' '}
              {actionTarget?.action === 'activate'
                ? '승인하시겠습니까? 승인 후 시스템에 접근할 수 있습니다.'
                : '비활성화하시겠습니까? 비활성화 후 시스템에 접근할 수 없습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={isActioning}
              className={
                actionTarget?.action === 'activate'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isActioning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  처리 중...
                </>
              ) : actionTarget?.action === 'activate' ? (
                '승인'
              ) : (
                '비활성화'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 비밀번호 리셋 다이얼로그 */}
      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null)
            setResetPassword('')
            setResetError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>비밀번호 리셋</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span className="font-medium text-gray-900">{resetTarget?.name}</span>
                <span className="text-gray-500"> ({resetTarget?.email})</span>
                님의 새 비밀번호를 입력해주세요.
                {resetError && (
                  <span className="block mt-2 text-sm text-red-600">{resetError}</span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => {
                setResetPassword(e.target.value)
                setResetError(null)
              }}
              placeholder="새 비밀번호 (8자 이상)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resetPassword.length >= 8) {
                  handleResetPassword()
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={isResetting || resetPassword.length < 8}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 역할 변경 확인 다이얼로그 */}
      <AlertDialog
        open={!!actionTarget && actionTarget.action === 'changeRole'}
        onOpenChange={() => setActionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>역할 변경</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-gray-900">
                {actionTarget?.employee.name}
              </span>
              님의 역할을{' '}
              <span className="font-medium">
                {ROLE_CONFIG[actionTarget?.employee.role || '']?.label}
              </span>
              에서{' '}
              <span className="font-medium">
                {ROLE_CONFIG[actionTarget?.newRole || '']?.label}
              </span>
              (으)로 변경하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeRole}
              disabled={isActioning}
            >
              {isActioning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  변경 중...
                </>
              ) : (
                '변경'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
