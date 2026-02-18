"use client"

/**
 * 📌 글씨 크기 선택기
 *
 * 일상생활 비유:
 * - 워드에서 글씨 크기 12pt, 14pt 선택하는 것처럼,
 * - 프리셋 크기를 빠르게 선택하거나 직접 숫자를 입력할 수 있어요.
 */

import { useState } from "react"
import { Editor } from "@tiptap/react"
import { Type, ChevronDown } from "lucide-react"
import { PRESET_SIZES } from "./constants"

export function FontSizeSelector({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("16")

  // 현재 글씨 크기 표시 (기본 16px)
  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes("textStyle")
    if (attrs.fontSize) {
      return attrs.fontSize.replace("px", "")
    }
    return "16"
  }

  // 글씨 크기 적용 함수
  const applySize = (size: string) => {
    editor
      .chain()
      .focus()
      .setMark("textStyle", { fontSize: `${size}px` })
      .run()
    setInputValue(size)
    setIsOpen(false)
  }

  // 글씨 크기 제거 (기본 크기로)
  const resetSize = () => {
    editor.chain().focus().unsetMark("textStyle").run()
    setInputValue("16")
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="글씨 크기"
        className="flex items-center gap-1 rounded px-2 py-1.5 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Type className="h-4 w-4" />
        <span className="min-w-[20px] text-xs">{getCurrentFontSize()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-40 rounded-lg border bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs text-gray-500">글씨 크기</p>

            {/* 프리셋 크기 버튼들 */}
            <div className="mb-3 grid grid-cols-4 gap-1">
              {PRESET_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => applySize(size)}
                  className={`rounded px-2 py-1.5 text-xs transition hover:bg-gray-100 ${getCurrentFontSize() === size ? "bg-gray-200 font-bold" : ""}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex items-center gap-1 border-t pt-2">
              <input
                type="number"
                min="8"
                max="72"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySize(inputValue)}
                className="w-14 rounded border px-2 py-1 text-xs"
                placeholder="24"
              />
              <span className="text-xs text-gray-500">px</span>
              <button
                type="button"
                onClick={() => applySize(inputValue)}
                className="text-primary hover:bg-primary/10 rounded px-2 py-1 text-xs"
              >
                적용
              </button>
            </div>

            {/* 기본 크기로 리셋 */}
            <button
              type="button"
              onClick={resetSize}
              className="mt-2 w-full rounded py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              기본 크기로
            </button>
          </div>
        </>
      )}
    </div>
  )
}
