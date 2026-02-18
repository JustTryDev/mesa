/**
 * 프로젝트 링크 셀 컴포넌트
 *
 * 테이블 인라인 편집과 모달에서 공용으로 사용하는 "만능 셀"입니다.
 *
 * 세 가지 상태를 가집니다:
 * 1. 링크 없음 → "생성" 버튼 표시
 * 2. 생성 중 → 로딩 스피너 + "생성 중..." (폴링으로 완료 대기)
 * 3. 링크 있음 → 클릭하면 새 탭에서 Canva 열기
 *
 * 폴링(Polling)이란?
 * "지금 도착했나요?" 하고 서버에 반복적으로 물어보는 것입니다.
 * 2초마다 "프로젝트 링크가 생겼나요?"라고 DB를 확인합니다.
 */
'use client'

import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react'
import { Loader2, Plus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase/client'

interface ProjectLinkCellProps {
  /** 고객 ID (DB primary key) */
  customerId: string
  /** 고객 코드 (C-00001 형식) */
  customerCode: string | null
  /** 현재 프로젝트 링크 값 */
  projectLink: string | null
  /** 링크 업데이트 시 부모에 알림 (로컬 상태 동기화용) */
  onLinkUpdate?: (newLink: string) => void
}

/** 폴링 설정 */
const POLL_INTERVAL_MS = 2000 // 2초마다 확인
const POLL_TIMEOUT_MS = 60000 // 최대 60초 대기

export default function ProjectLinkCell({
  customerId,
  customerCode,
  projectLink,
  onLinkUpdate,
}: ProjectLinkCellProps) {
  // 생성 요청 진행 상태
  const [isCreating, setIsCreating] = useState(false)
  // 에러 메시지
  const [error, setError] = useState<string | null>(null)
  // 현재 표시할 링크 (props에서 받은 값 또는 폴링으로 감지한 값)
  const [currentLink, setCurrentLink] = useState(projectLink)
  // 폴링 타이머 참조 (컴포넌트 언마운트 시 정리용)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef = useRef<number>(0)

  // props가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setCurrentLink(projectLink)
  }, [projectLink])

  /** 폴링 중지 함수 */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  /** DB에서 project_link를 조회하는 폴링 함수 */
  const pollForLink = useCallback(() => {
    pollStartRef.current = Date.now()

    pollTimerRef.current = setInterval(async () => {
      // 타임아웃 체크: 60초 초과 시 폴링 중지
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopPolling()
        setIsCreating(false)
        setError('프로젝트 생성 시간이 초과되었습니다. 잠시 후 페이지를 새로고침해 주세요.')
        return
      }

      try {
        const supabase = getSupabase()
        const { data } = await supabase
          .from('customers')
          .select('project_link')
          .eq('id', customerId)
          .single()

        // 링크가 생겼으면 폴링 중지 + 상태 업데이트
        if (data?.project_link) {
          stopPolling()
          setCurrentLink(data.project_link)
          setIsCreating(false)
          setError(null)
          // 부모 컴포넌트에 알림 (테이블 로컬 상태 동기화)
          onLinkUpdate?.(data.project_link)
        }
      } catch {
        // 폴링 중 네트워크 오류는 무시 (다음 폴링에서 재시도)
      }
    }, POLL_INTERVAL_MS)
  }, [customerId, onLinkUpdate, stopPolling])

  /** "생성" 버튼 클릭 핸들러 */
  const handleCreate = async (e: MouseEvent) => {
    // 테이블 행 클릭 이벤트로 전파되지 않도록 차단
    e.stopPropagation()
    setIsCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/customers/create-canva-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || '프로젝트 생성 요청에 실패했습니다.')
        setIsCreating(false)
        return
      }

      // 요청 성공 → 폴링 시작 (Zapier가 비동기로 처리하므로)
      pollForLink()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setIsCreating(false)
    }
  }

  // 상태 1: 생성 중 (로딩)
  if (isCreating) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>생성 중...</span>
      </div>
    )
  }

  // 상태 2: 에러
  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-red-500 truncate" title={error}>
          {error}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreate}
          className="h-6 text-xs px-2 text-gray-500 hover:text-gray-700"
        >
          다시 시도
        </Button>
      </div>
    )
  }

  // 상태 3: 링크가 있을 때 → 새 탭에서 Canva 열기
  if (currentLink) {
    return (
      <a
        href={currentLink}
        target="_blank"
        rel="noopener noreferrer"
        // stopPropagation: 테이블 행 클릭(고객 모달 열기)으로 전파 차단
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-sm text-[#1a2867] hover:underline truncate max-w-full"
        title={currentLink}
      >
        <Link2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{customerCode || '프로젝트 보기'}</span>
      </a>
    )
  }

  // 상태 4: 링크가 없을 때 → "생성" 버튼
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCreate}
      className="h-7 text-xs px-2 text-gray-500 hover:text-[#1a2867] hover:bg-gray-50"
    >
      <Plus className="w-3.5 h-3.5 mr-1" />
      생성
    </Button>
  )
}
