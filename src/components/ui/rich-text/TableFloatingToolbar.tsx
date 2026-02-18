"use client"

/**
 * 📌 TableFloatingToolbar - 테이블 편집용 플로팅 툴바
 *
 * 일상생활 비유:
 * - 이미지 선택하면 위에 뜨는 편집 버튼처럼,
 * - 테이블 안을 클릭하면 바로 위에 편집 도구가 나타나요.
 *
 * 기능:
 * - 행/열 추가 및 삭제
 * - 헤더 행/열 토글
 * - 셀 배경색 변경
 * - 테이블 삭제
 */

import { useState, useRef, useEffect } from "react"
import { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus,
  Trash2,
  Paintbrush,
  Rows3,
  Columns3,
} from "lucide-react"
import { CELL_BACKGROUND_COLORS } from "./constants"

export function TableFloatingToolbar({ editor }: { editor: Editor }) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  // 📌 커스텀 색상 선택용 state
  const [customColor, setCustomColor] = useState("#BFDBFE")

  // 📌 핵심 수정: 마운트 상태 추적 (비동기 콜백에서 언마운트 감지용)
  const isMountedRef = useRef(true)

  // 📌 핵심 수정: 언마운트 시 cleanup - 페이지 이동 시 비동기 작업 차단
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 에디터가 파괴되었거나 뷰가 준비되지 않았으면 렌더링하지 않음
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (editor.isDestroyed || !(editor.view as any)?.docView) return null

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, view }) => {
        // 📌 마운트 상태 체크 (비동기 콜백에서 중요! - domFromPos 에러 방지)
        if (!isMountedRef.current) return false
        // 에디터 뷰가 준비되지 않았거나 파괴된 상태면 숨김
        if (!view?.dom || editor.isDestroyed) return false
        // docView가 없으면 위치 계산 불가
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(view as any).docView) return false
        // 테이블 활성화 확인
        return editor.isActive("table")
      }}
      // 📌 updateDelay 증가로 race condition 완화
      updateDelay={300}
      options={{
        placement: "top",
        offset: 8,
      }}
      className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1.5 shadow-lg"
    >
      {/* 📌 행 조작 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        title="위에 행 추가"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        title="아래에 행 추가"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="rounded p-1.5 text-red-500 hover:bg-gray-100"
        title="행 삭제"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* 구분선 */}
      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* 📌 열 조작 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        title="왼쪽에 열 추가"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        title="오른쪽에 열 추가"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="rounded p-1.5 text-red-500 hover:bg-gray-100"
        title="열 삭제"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* 구분선 */}
      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* 📌 헤더 토글 버튼 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        className={`rounded p-1.5 hover:bg-gray-100 ${
          editor.isActive("tableHeader") ? "bg-blue-100 text-blue-600" : "text-gray-600"
        }`}
        title="헤더 행 토글 (첫 번째 행)"
      >
        <Rows3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        title="헤더 열 토글 (첫 번째 열)"
      >
        <Columns3 className="h-4 w-4" />
      </button>

      {/* 구분선 */}
      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* 📌 셀 배경색 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          title="셀 배경색"
        >
          <Paintbrush className="h-4 w-4" />
        </button>

        {/* 색상 피커 드롭다운 */}
        {showColorPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
            <div className="absolute top-full left-1/2 z-50 mt-2 w-44 -translate-x-1/2 rounded-lg border bg-white p-2 shadow-xl">
              <p className="mb-2 text-xs text-gray-500">셀 배경색</p>
              {/* 📌 프리셋 색상 그리드 */}
              <div className="grid grid-cols-5 gap-1">
                {CELL_BACKGROUND_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setCellAttribute("backgroundColor", color.value).run()
                      setShowColorPicker(false)
                    }}
                    className={`h-6 w-6 rounded border-2 transition-transform hover:scale-110 ${
                      color.value === null
                        ? "relative overflow-hidden border-gray-300 bg-white"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color.value || "transparent" }}
                    title={color.label}
                  >
                    {/* 투명 색상 표시 (대각선) */}
                    {color.value === null && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-0.5 w-full rotate-45 bg-red-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 📌 자유 색상 선택 (컬러 피커) */}
              <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
                <span className="text-xs text-gray-500">직접 선택:</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    editor.chain().focus().setCellAttribute("backgroundColor", e.target.value).run()
                  }}
                  className="h-6 w-6 cursor-pointer rounded border-0 p-0"
                  title="색상 직접 선택"
                />
                <span className="font-mono text-xs text-gray-600">{customColor}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 구분선 */}
      <div className="mx-1 h-5 w-px bg-gray-200" />

      {/* 📌 테이블 삭제 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="rounded p-1.5 text-red-500 hover:bg-red-50"
        title="테이블 삭제"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </BubbleMenu>
  )
}
