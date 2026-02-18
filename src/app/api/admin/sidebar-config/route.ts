/**
 * 사이드바 설정 API
 *
 * GET  /api/admin/sidebar-config - 설정 조회 (모든 직원)
 * PUT  /api/admin/sidebar-config - 설정 저장 (admin/super_admin만)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, requireAdmin } from '@/lib/auth/api-auth'
import { sidebarConfigSchema } from '@/lib/validations/sidebar-config'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * GET: 사이드바 설정 조회
 */
export async function GET() {
  const auth = await requireEmployee()
  if (!auth.success) return auth.response

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('admin_sidebar_config')
      .select('config, version, updated_at')
      .eq('id', 'singleton')
      .single()

    if (error || !data) {
      // 설정이 없으면 null 반환 (클라이언트가 기본값 사용)
      return NextResponse.json({ config: null, version: 0 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Sidebar Config GET] 오류:', error)
    return NextResponse.json(
      { error: '설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PUT: 사이드바 설정 저장
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { config, version } = body

    // Zod 검증
    const validated = sidebarConfigSchema.safeParse(config)
    if (!validated.success) {
      return NextResponse.json(
        { error: '잘못된 설정 형식입니다.', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const newVersion = (version || 0) + 1

    // upsert: 없으면 생성, 있으면 업데이트
    const { error } = await supabase
      .from('admin_sidebar_config')
      .upsert({
        id: 'singleton',
        config: validated.data,
        version: newVersion,
        updated_by: auth.data.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (error) {
      console.error('[Sidebar Config PUT] 오류:', error)
      return NextResponse.json(
        { error: '설정 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, version: newVersion })
  } catch (error) {
    console.error('[Sidebar Config PUT] 오류:', error)
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
