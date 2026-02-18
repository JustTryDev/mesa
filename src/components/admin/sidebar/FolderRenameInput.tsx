/**
 * 폴더 이름 인라인 편집 컴포넌트
 *
 * 더블클릭 또는 "이름 변경" 선택 시 활성화됩니다.
 * Enter로 확정, Esc로 취소
 */
'use client'

import { useState, useRef, useEffect } from 'react'

interface FolderRenameInputProps {
  currentName: string
  onConfirm: (newName: string) => void
  onCancel: () => void
}

export default function FolderRenameInput({
  currentName,
  onConfirm,
  onCancel,
}: FolderRenameInputProps) {
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 포커스 + 전체 선택
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleConfirm()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      onBlur={handleConfirm}
      className="w-full px-1 py-0.5 text-xs text-gray-900 border border-blue-400 rounded outline-none bg-white"
      maxLength={30}
    />
  )
}
