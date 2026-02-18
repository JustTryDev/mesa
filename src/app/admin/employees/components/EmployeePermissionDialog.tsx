/**
 * 직원 메뉴 권한 설정 다이얼로그
 * Staff 직원의 메뉴별 접근 권한을 토글
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getSupabase } from '@/lib/supabase/client'
import { ADMIN_MENUS } from '@/lib/constants/adminMenus'

interface EmployeePermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 대상 직원 정보 */
  employee: {
    id: string
    name: string
    role: string
  } | null
}

interface PermissionState {
  [menuId: string]: boolean
}

export default function EmployeePermissionDialog({
  open,
  onOpenChange,
  employee,
}: EmployeePermissionDialogProps) {
  const [permissions, setPermissions] = useState<PermissionState>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 현재 권한 로드
  const loadPermissions = useCallback(async () => {
    if (!employee) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      const { data, error: fetchError } = await supabase
        .rpc('get_employee_menu_permissions', {
          target_employee_id: employee.id,
        })

      if (fetchError) {
        setError('권한 정보를 불러올 수 없습니다.')
        return
      }

      // 메뉴별 권한 맵 생성 (기본: false)
      const permMap: PermissionState = {}
      ADMIN_MENUS.forEach(menu => {
        permMap[menu.id] = false
      })

      // DB에서 가져온 값 적용
      if (data) {
        (data as Array<{ menu_id: string; can_access: boolean }>).forEach(
          (perm) => {
            permMap[perm.menu_id] = perm.can_access
          }
        )
      }

      setPermissions(permMap)
    } catch {
      setError('권한 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [employee])

  useEffect(() => {
    if (open && employee) {
      loadPermissions()
    }
  }, [open, employee, loadPermissions])

  // 권한 저장
  const handleSave = async () => {
    if (!employee) return

    setIsSaving(true)
    setError(null)

    try {
      const supabase = getSupabase()

      // JSONB 형식으로 변환
      const permissionsArray = Object.entries(permissions).map(([menu_id, can_access]) => ({
        menu_id,
        can_access,
      }))

      const { error: saveError } = await supabase.rpc('set_employee_menu_permissions', {
        target_employee_id: employee.id,
        permissions: permissionsArray,
      })

      if (saveError) {
        setError(`권한 저장에 실패했습니다: ${saveError.message}`)
        return
      }

      onOpenChange(false)
    } catch {
      setError('권한 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 메뉴 그룹별 정리
  const groupedMenus = ADMIN_MENUS.reduce<Record<string, typeof ADMIN_MENUS>>(
    (acc, menu) => {
      const group = menu.group || 'other'
      if (!acc[group]) acc[group] = []
      acc[group].push(menu)
      return acc
    },
    {}
  )

  const GROUP_LABELS: Record<string, string> = {
    content: '콘텐츠 관리',
    orders: '주문 관리',
    tools: '도구',
    members: '회원 관리',
    other: '기타',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            메뉴 권한 설정
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-900">{employee?.name}</span>님의 메뉴 접근 권한을 설정합니다.
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
            <span className="text-sm">권한 정보 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {Object.entries(groupedMenus).map(([group, menus]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {GROUP_LABELS[group] || group}
                </h3>
                <div className="space-y-3">
                  {menus.map((menu) => {
                    const Icon = menu.icon
                    return (
                      <div
                        key={menu.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                      >
                        <Label
                          htmlFor={`perm-${menu.id}`}
                          className="flex items-center gap-2.5 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{menu.label}</span>
                        </Label>
                        <Switch
                          id={`perm-${menu.id}`}
                          checked={permissions[menu.id] ?? false}
                          onCheckedChange={(checked) =>
                            setPermissions(prev => ({ ...prev, [menu.id]: checked }))
                          }
                          disabled={isSaving}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
