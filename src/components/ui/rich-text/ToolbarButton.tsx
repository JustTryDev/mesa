"use client"

/**
 * 📌 ToolbarButton & Divider - 툴바 기본 UI 컴포넌트
 *
 * 마치 리모컨의 버튼 하나하나처럼,
 * 에디터 툴바의 각 기능 버튼을 렌더링합니다.
 */

import React from "react"

/**
 * 툴바 버튼 컴포넌트
 * 볼드, 이탤릭 등 각 서식 버튼을 렌더링합니다
 */
export function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-2 transition-colors hover:bg-gray-100 ${isActive ? "text-primary bg-gray-200" : "text-gray-600"} ${disabled ? "cursor-not-allowed opacity-50" : ""} `}
    >
      {children}
    </button>
  )
}

/**
 * 구분선 컴포넌트
 * 툴바 버튼들 사이의 시각적 구분을 위해 사용합니다.
 */
export function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-300" />
}
