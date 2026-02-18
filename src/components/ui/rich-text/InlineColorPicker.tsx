"use client"

/**
 * 📌 인라인 컬러 피커
 *
 * 팝업 대신 툴바에 바로 표시되는 색상 선택기입니다.
 * - Color Picker + HEX 입력 + 현재 색상 미리보기
 * - 최근 사용한 색상 5개 히스토리 (localStorage에 저장)
 *
 * 일상생활 비유:
 * 마치 그림판에서 색상을 선택하면 바로 적용되고,
 * 최근에 쓴 색상이 아래에 보이는 것처럼 동작합니다.
 */

import { useState, useCallback } from "react"
import { Editor } from "@tiptap/react"
import { X } from "lucide-react"
import { editorColorStorage } from "@/lib/storage"

export function InlineColorPicker({
  editor,
  type,
  label,
}: {
  editor: Editor
  type: "text" | "highlight"
  label: string
}) {
  // 에디터 ID (type 기반)
  const editorId = type

  // 최근 사용 색상 목록 (통합 storage 유틸에서 불러오기)
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    return editorColorStorage.getColors(editorId)
  })

  // 현재 적용된 색상
  const currentColor =
    type === "text"
      ? editor.getAttributes("textStyle").color || "#000000"
      : editor.getAttributes("highlight").color || "#FEF08A"

  /**
   * 색상 적용 함수
   * 1. 에디터에 색상 적용
   * 2. 최근 사용 색상 목록 업데이트 (통합 storage 유틸 사용)
   */
  const applyColor = useCallback(
    (color: string) => {
      // 에디터에 색상 적용
      if (type === "text") {
        editor.chain().focus().setColor(color).run()
      } else {
        editor.chain().focus().setHighlight({ color }).run()
      }

      // 최근 사용 색상 업데이트 (최대 5개, 통합 storage 유틸 사용)
      const updated = editorColorStorage.addColor(editorId, color, 5)
      setRecentColors(updated)
    },
    [editor, type, editorId]
  )

  /**
   * 색상 제거 함수
   */
  const removeColor = useCallback(() => {
    if (type === "text") {
      editor.chain().focus().unsetColor().run()
    } else {
      editor.chain().focus().unsetHighlight().run()
    }
  }, [editor, type])

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1">
      {/* 라벨 */}
      <span className="min-w-[40px] text-xs text-gray-500">{label}</span>

      {/* HTML5 Color Picker */}
      <input
        type="color"
        value={currentColor}
        onChange={(e) => applyColor(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded border-0 p-0"
        title="색상 선택"
      />

      {/* 현재 색상 미리보기 */}
      <div
        className="h-5 w-5 rounded border border-gray-200"
        style={{ backgroundColor: currentColor }}
      />

      {/* HEX 코드 입력 */}
      <input
        type="text"
        value={currentColor}
        onChange={(e) => {
          // 유효한 HEX 코드일 때만 적용
          if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            applyColor(e.target.value)
          }
        }}
        className="w-[72px] rounded border px-1.5 py-0.5 text-center font-mono text-xs"
        placeholder="#000000"
      />

      {/* 색상 제거 버튼 */}
      <button
        type="button"
        onClick={removeColor}
        className="px-1 text-xs text-gray-400 hover:text-gray-600"
        title="색상 제거"
      >
        <X className="h-3 w-3" />
      </button>

      {/* 📌 최근 사용 색상 히스토리 */}
      {recentColors.length > 0 && (
        <div className="ml-1 flex gap-0.5 border-l border-gray-200 pl-1">
          {recentColors.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyColor(color)}
              className="h-4 w-4 rounded-full border border-gray-200 transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  )
}
