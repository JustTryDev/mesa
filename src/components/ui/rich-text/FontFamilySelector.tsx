"use client"

/**
 * 📌 폰트 선택기
 *
 * 일상생활 비유:
 * - 워드에서 "맑은 고딕", "바탕체" 등 글꼴을 선택하는 것처럼,
 * - 드롭다운에서 원하는 폰트를 선택할 수 있어요.
 */

import { useState } from "react"
import { Editor } from "@tiptap/react"
import { ChevronDown } from "lucide-react"
import { FONT_OPTIONS } from "./constants"

export function FontFamilySelector({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)

  // 현재 선택된 폰트
  const getCurrentFont = () => {
    const attrs = editor.getAttributes("textStyle")
    return attrs.fontFamily || "Pretendard"
  }

  // 현재 폰트의 라벨 찾기
  const getCurrentFontLabel = () => {
    const currentFont = getCurrentFont()
    const found = FONT_OPTIONS.find((f) => f.value === currentFont)
    return found ? found.label : "폰트"
  }

  // 폰트 적용 함수
  const applyFont = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run()
    setIsOpen(false)
  }

  // 폰트 초기화
  const resetFont = () => {
    editor.chain().focus().unsetFontFamily().run()
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="폰트 선택"
        className="flex min-w-[80px] items-center gap-1 rounded px-2 py-1.5 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <span className="max-w-[60px] truncate text-xs">{getCurrentFontLabel()}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl">
            <p className="mb-2 px-1 text-xs text-gray-500">폰트 선택</p>

            {/* 폰트 목록 */}
            <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => applyFont(font.value)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm transition hover:bg-gray-100 ${getCurrentFont() === font.value ? "bg-gray-200 font-bold" : ""}`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>

            {/* 초기화 버튼 */}
            <button
              type="button"
              onClick={resetFont}
              className="mt-2 w-full rounded border-t py-1 pt-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              기본 폰트로
            </button>
          </div>
        </>
      )}
    </div>
  )
}
