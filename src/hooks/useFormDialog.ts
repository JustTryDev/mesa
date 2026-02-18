/**
 * 폼 다이얼로그 공용 훅
 *
 * 마트에서 주문서를 처리하는 절차(작성→확인→전송→완료)가 항상 같은데,
 * 매번 처음부터 적는 대신 이 양식 하나를 쓰면 됩니다.
 *
 * 9개 다이얼로그에서 반복되던 저장 로직을 이 훅 하나로 통합합니다.
 */
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseFormDialogOptions {
  /** API 엔드포인트 URL */
  apiUrl: string
  /** HTTP 메서드 (기본: POST) */
  method?: 'POST' | 'PATCH' | 'PUT'
  /** 성공 시 콜백 (예: 목록 새로고침) */
  onSuccess: () => void
  /** 다이얼로그 닫기 콜백 */
  onClose: () => void
  /** 성공 메시지 (기본: '저장되었습니다.') */
  successMessage?: string
}

export function useFormDialog({
  apiUrl,
  method = 'POST',
  onSuccess,
  onClose,
  successMessage = '저장되었습니다.',
}: UseFormDialogOptions) {
  const [isSaving, setIsSaving] = useState(false)

  const submitForm = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSaving(true)
      try {
        const res = await fetch(apiUrl, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || '저장에 실패했습니다.')

        toast.success(successMessage)
        onSuccess()
        onClose()
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '오류가 발생했습니다.'
        toast.error(message)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [apiUrl, method, onSuccess, onClose, successMessage]
  )

  return { isSaving, submitForm }
}
