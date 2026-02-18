"use client"

/**
 * 📌 TableGridPicker - 그리드로 테이블 크기 선택
 *
 * 일상생활 비유:
 * - 워드에서 표 삽입할 때 마우스로 행x열을 드래그해서 선택하는 것처럼,
 * - 10x10 그리드에서 원하는 크기를 시각적으로 선택할 수 있어요.
 */

import { useState } from "react"
import { Editor } from "@tiptap/react"
import { Table } from "lucide-react"

export function TableGridPicker({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  // 마우스가 호버된 위치 (행, 열)
  const [hovered, setHovered] = useState({ row: 0, col: 0 })

  // 테이블 안에 커서가 있는지 확인
  const isInTable = editor.isActive("table")

  // 테이블 삽입
  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setIsOpen(false)
    setHovered({ row: 0, col: 0 })
  }

  // 10x10 그리드 생성
  const gridSize = 10

  return (
    <div className="relative">
      {/* 테이블 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="테이블 삽입"
        className={`rounded p-2 transition-colors hover:bg-gray-100 ${
          isInTable ? "text-primary bg-gray-200" : "text-gray-600"
        }`}
      >
        <Table className="h-4 w-4" />
      </button>

      {/* 그리드 피커 드롭다운 */}
      {isOpen && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs text-gray-500">테이블 크기 선택</p>

            {/* 📌 10x10 그리드 */}
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              onMouseLeave={() => setHovered({ row: 0, col: 0 })}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                const row = Math.floor(index / gridSize) + 1
                const col = (index % gridSize) + 1
                const isSelected = row <= hovered.row && col <= hovered.col

                return (
                  <button
                    key={index}
                    type="button"
                    className={`h-5 w-5 rounded-sm border transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-gray-200 bg-gray-100 hover:border-gray-300"
                    }`}
                    onMouseEnter={() => setHovered({ row, col })}
                    onClick={() => insertTable(row, col)}
                  />
                )
              })}
            </div>

            {/* 📌 현재 선택된 크기 표시 */}
            <div className="mt-2 text-center">
              <span className="text-sm font-medium text-gray-700">
                {hovered.row > 0 && hovered.col > 0
                  ? `${hovered.row} × ${hovered.col}`
                  : "마우스를 올려 선택"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
