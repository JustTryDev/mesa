"use client"

/**
 * 📌 이미지 미디어 메뉴
 *
 * 일상생활 비유:
 * 인스타그램에서 여러 사진을 한 번에 올릴 때 슬라이드/갤러리를 선택하는 것처럼,
 * 여러 이미지를 원하는 형태로 삽입할 수 있어요.
 */

import { useState } from "react"
import { Editor } from "@tiptap/react"
import { Images, GalleryHorizontal } from "lucide-react"

export function ImageMediaMenu({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 향후 에디터 상태 기반 UI 표시용
  editor: _editor,
  onSelectImages,
}: {
  editor: Editor
  onSelectImages: (type: "slider" | "gallery") => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="슬라이드/갤러리 삽입"
        className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Images className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl">
            <p className="mb-2 px-1 text-xs text-gray-500">멀티 이미지</p>

            {/* 슬라이드 삽입 */}
            <button
              type="button"
              onClick={() => {
                onSelectImages("slider")
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-gray-100"
            >
              <GalleryHorizontal className="h-4 w-4" />
              <div>
                <p className="font-medium">슬라이드</p>
                <p className="text-xs text-gray-500">좌우로 넘기는 형태</p>
              </div>
            </button>

            {/* 갤러리 삽입 */}
            <button
              type="button"
              onClick={() => {
                onSelectImages("gallery")
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-gray-100"
            >
              <Images className="h-4 w-4" />
              <div>
                <p className="font-medium">갤러리</p>
                <p className="text-xs text-gray-500">격자 형태로 배열</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
