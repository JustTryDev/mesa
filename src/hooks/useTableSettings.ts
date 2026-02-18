/**
 * 테이블 설정 훅 (컬럼 너비 조절 + 순서 변경 + 컬럼 숨기기 + 사용자별 DB 저장)
 *
 * 컬럼 헤더를 드래그하여 너비를 조절하고, 드래그&드롭으로 순서를 변경하고,
 * 컬럼을 숨기거나 표시할 수 있습니다.
 * 설정은 Supabase DB (user_ui_settings 테이블)에 사용자별로 저장됩니다.
 *
 * 하위 호환: 기존 localStorage에 데이터가 있고 DB에 없으면 자동 마이그레이션합니다.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/storage'
import { useUserUISetting } from '@/hooks/useUserUISetting'

// 최소 컬럼 너비 (px)
const MIN_WIDTH = 60

// 컬럼 정의 인터페이스 (각 페이지의 ColumnDef와 호환)
export interface ColumnDef {
  key: string
  label: string
  sortField?: string
  align?: 'left' | 'right' | 'center'
  sticky?: boolean
}

// 저장되는 테이블 설정 구조
interface TableSettings {
  columnWidths: Record<string, number>
  columnOrder: string[]
  hiddenColumns?: string[]
}

// 훅 옵션
interface UseTableSettingsOptions {
  pageId: string                         // 페이지 식별자 (e.g. 'customers')
  columns: ColumnDef[]                   // 원본 컬럼 정의 배열
  defaultWidths: Record<string, number>  // 기본 컬럼 너비
  userId: string | undefined             // 인증된 사용자 ID
  requiredColumns?: string[]             // 숨기기 불가한 필수 컬럼 키 목록
}

/**
 * localStorage 키 생성 (마이그레이션용)
 */
function getLegacyStorageKey(userId: string, pageId: string): string {
  return `${STORAGE_KEYS.TABLE_SETTINGS_PREFIX}_${userId}_${pageId}`
}

/**
 * 저장된 설정의 유효성 검증 후 적용
 */
function validateAndApplySettings(
  saved: TableSettings,
  defaultWidths: Record<string, number>,
  defaultOrder: string[],
  requiredSet: Set<string>,
  columns: ColumnDef[],
): { widths: Record<string, number>; order: string[]; hidden: Set<string> } {
  // 너비: 기본값 + 저장값 병합
  const widths = { ...defaultWidths, ...saved.columnWidths }

  // 순서: 저장된 키가 현재 컬럼과 일치하는 경우만 적용
  let order = defaultOrder
  if (saved.columnOrder) {
    const savedSet = new Set(saved.columnOrder)
    const currentSet = new Set(defaultOrder)
    const isValid =
      saved.columnOrder.length === defaultOrder.length &&
      defaultOrder.every(k => savedSet.has(k)) &&
      saved.columnOrder.every(k => currentSet.has(k))
    if (isValid) {
      order = saved.columnOrder
    }
  }

  // 숨긴 컬럼 (필수/sticky 제외)
  let hidden = new Set<string>()
  if (saved.hiddenColumns && Array.isArray(saved.hiddenColumns)) {
    const validHidden = saved.hiddenColumns.filter(
      k => defaultOrder.includes(k) && !requiredSet.has(k) && !columns.find(c => c.key === k)?.sticky
    )
    hidden = new Set(validHidden)
  }

  return { widths, order, hidden }
}

export function useTableSettings({
  pageId,
  columns,
  defaultWidths,
  userId,
  requiredColumns = [],
}: UseTableSettingsOptions) {
  // DB 설정 훅
  const dbSetting = useUserUISetting<TableSettings>('table_columns', pageId)

  // 기본 컬럼 순서 (sticky 포함 전체)
  const defaultOrder = useMemo(() => columns.map(c => c.key), [columns])

  // 상태
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths)
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  // --- 리사이즈 상태 ---
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // --- 드래그 리오더 상태 ---
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // 최신 상태 참조 (persist 콜백 안에서 사용)
  const columnWidthsRef = useRef(columnWidths)
  const columnOrderRef = useRef(columnOrder)
  const hiddenColumnsRef = useRef(hiddenColumns)
  columnWidthsRef.current = columnWidths
  columnOrderRef.current = columnOrder
  hiddenColumnsRef.current = hiddenColumns

  // 필수 컬럼 Set (메모이제이션)
  const requiredSet = useMemo(() => new Set(requiredColumns), [requiredColumns])

  // DB 로드 완료 후 적용 + localStorage 마이그레이션
  const appliedRef = useRef(false)
  useEffect(() => {
    if (dbSetting.isLoading) return
    if (appliedRef.current) return
    appliedRef.current = true

    if (dbSetting.data) {
      // DB에 설정이 있으면 적용
      const { widths, order, hidden } = validateAndApplySettings(
        dbSetting.data, defaultWidths, defaultOrder, requiredSet, columns
      )
      setColumnWidths(widths)
      setColumnOrder(order)
      setHiddenColumns(hidden)
    } else if (userId) {
      // DB에 없으면 localStorage에서 마이그레이션 시도
      const legacyKey = getLegacyStorageKey(userId, pageId)
      const legacy = getStorageItem<TableSettings | null>(legacyKey, null)

      if (legacy) {
        const { widths, order, hidden } = validateAndApplySettings(
          legacy, defaultWidths, defaultOrder, requiredSet, columns
        )
        setColumnWidths(widths)
        setColumnOrder(order)
        setHiddenColumns(hidden)

        // DB에 마이그레이션 저장 후 localStorage 삭제
        dbSetting.save(legacy).then(() => {
          removeStorageItem(legacyKey)
        })
      }
    }
  }, [dbSetting.isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // userId 변경 시 재로드 (로그아웃/로그인 전환)
  const prevUserIdRef = useRef(userId)
  useEffect(() => {
    if (prevUserIdRef.current === userId) return
    prevUserIdRef.current = userId
    appliedRef.current = false

    if (!userId) {
      // 미인증 → 기본값
      setColumnWidths(defaultWidths)
      setColumnOrder(defaultOrder)
      setHiddenColumns(new Set())
    }
  }, [userId, defaultWidths, defaultOrder])

  // --- 설정 저장 (DB) ---
  const persist = useCallback((
    widths: Record<string, number>,
    order: string[],
    hidden?: Set<string>,
  ) => {
    if (!userId) return
    const hiddenArr = Array.from(hidden ?? hiddenColumnsRef.current)
    const settings: TableSettings = {
      columnWidths: widths,
      columnOrder: order,
      hiddenColumns: hiddenArr.length > 0 ? hiddenArr : undefined,
    }
    dbSetting.save(settings)
  }, [userId, dbSetting.save]) // eslint-disable-line react-hooks/exhaustive-deps

  // =============================================
  // 컬럼 리사이즈
  // =============================================

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey] || defaultWidths[columnKey] || 100)
  }, [columnWidths, defaultWidths])

  // 리사이즈 중 마우스 이동/해제
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX
      const newWidth = Math.max(MIN_WIDTH, startWidth + diff)

      setColumnWidths(prev => {
        const next = { ...prev, [resizingColumn]: newWidth }
        return next
      })
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      // 최종 너비 저장
      persist(columnWidthsRef.current, columnOrderRef.current)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizingColumn, startX, startWidth, persist])

  // =============================================
  // 컬럼 드래그&드롭 리오더
  // =============================================

  const handleDragStart = useCallback((columnKey: string) => {
    setDraggedColumn(columnKey)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    // sticky 컬럼 위로는 드롭 불가
    const targetCol = columns.find(c => c.key === columnKey)
    if (targetCol?.sticky) return
    setDragOverColumn(columnKey)
  }, [columns])

  const handleDrop = useCallback((targetKey: string) => {
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    // sticky 컬럼 위로 드롭 방지
    const targetCol = columns.find(c => c.key === targetKey)
    if (targetCol?.sticky) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    setColumnOrder(prev => {
      const newOrder = [...prev]
      const fromIdx = newOrder.indexOf(draggedColumn)
      const toIdx = newOrder.indexOf(targetKey)
      if (fromIdx === -1 || toIdx === -1) return prev

      // 제거 후 삽입
      newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, draggedColumn)

      // 저장
      persist(columnWidthsRef.current, newOrder)
      return newOrder
    })

    setDraggedColumn(null)
    setDragOverColumn(null)
  }, [draggedColumn, columns, persist])

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }, [])

  // =============================================
  // 컬럼 숨기기/표시
  // =============================================

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    // 필수/sticky 컬럼은 토글 불가
    if (requiredSet.has(columnKey)) return
    const col = columns.find(c => c.key === columnKey)
    if (col?.sticky) return

    setHiddenColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnKey)) {
        next.delete(columnKey)
      } else {
        next.add(columnKey)
      }
      // 저장
      persist(columnWidthsRef.current, columnOrderRef.current, next)
      return next
    })
  }, [requiredSet, columns, persist])

  // 모든 컬럼 표시
  const showAllColumns = useCallback(() => {
    setHiddenColumns(new Set())
    persist(columnWidthsRef.current, columnOrderRef.current, new Set())
  }, [persist])

  // =============================================
  // 설정 초기화 (너비 + 순서 + 숨기기 모두)
  // =============================================

  const resetSettings = useCallback(() => {
    setColumnWidths(defaultWidths)
    setColumnOrder(defaultOrder)
    setHiddenColumns(new Set())
    // DB에서 삭제
    dbSetting.reset()
    // localStorage 잔여 데이터도 삭제
    if (userId) {
      const legacyKey = getLegacyStorageKey(userId, pageId)
      removeStorageItem(legacyKey)
    }
  }, [defaultWidths, defaultOrder, dbSetting.reset, userId, pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  // =============================================
  // 정렬된 컬럼 배열 (sticky는 항상 마지막)
  // =============================================

  // 전체 컬럼 (순서 반영, 숨김 포함 — Popover UI용)
  const orderedColumns = useMemo(() => {
    const nonSticky = columnOrder
      .map(key => columns.find(c => c.key === key))
      .filter((c): c is ColumnDef => !!c && !c.sticky)

    const sticky = columns.filter(c => c.sticky)
    return [...nonSticky, ...sticky]
  }, [columnOrder, columns])

  // 보이는 컬럼만 (테이블 렌더링용)
  const visibleColumns = useMemo(() => {
    return orderedColumns.filter(col => !hiddenColumns.has(col.key))
  }, [orderedColumns, hiddenColumns])

  // 총 테이블 너비 계산 (보이는 컬럼만)
  const totalWidth = visibleColumns.reduce(
    (sum, col) => sum + (columnWidths[col.key] || defaultWidths[col.key] || 100),
    0,
  )

  return {
    // 컬럼 너비
    columnWidths,
    // 전체 컬럼 목록 (순서 반영, 숨김 포함 — Popover UI용)
    orderedColumns,
    // 보이는 컬럼만 (테이블 렌더링용)
    visibleColumns,
    // 총 테이블 너비
    totalWidth,
    // 리사이즈
    handleResizeMouseDown,
    isResizing: !!resizingColumn,
    // 리오더
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    draggedColumn,
    dragOverColumn,
    // 컬럼 숨기기
    hiddenColumns,
    toggleColumnVisibility,
    showAllColumns,
    requiredColumns: requiredSet,
    // 초기화
    resetSettings,
  }
}

export default useTableSettings
