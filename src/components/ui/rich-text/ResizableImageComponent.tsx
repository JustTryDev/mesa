"use client"

/**
 * 📌 ResizableImageComponent - 리사이즈 가능한 이미지 컴포넌트
 *
 * 일상생활 비유:
 * 파워포인트에서 이미지를 클릭하면 모서리에 조절점이 나타나고,
 * 그걸 드래그하면 크기를 조절할 수 있잖아요?
 * 이 컴포넌트가 바로 그 기능을 제공합니다!
 *
 * 기술 설명:
 * TipTap의 NodeViewWrapper를 사용해서 이미지 주변에
 * 리사이즈 핸들, 정렬 버튼 등을 추가할 수 있어요.
 */

import { useState, useRef, useCallback } from "react"
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from "lucide-react"

export function ResizableImageComponent({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  // 현재 리사이즈 중인지 여부
  const [isResizing, setIsResizing] = useState(false)
  // 리사이즈 중 표시할 현재 크기
  const [currentSize, setCurrentSize] = useState({ width: 0, height: 0 })
  // 이미지 요소 참조
  const imageRef = useRef<HTMLImageElement>(null)
  // 드래그 시작 위치와 초기 크기 저장
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })

  /**
   * 리사이즈 시작 핸들러
   *
   * 📌 작동 원리:
   * 1. 마우스 다운 이벤트에서 시작 위치를 기록
   * 2. document에 mousemove, mouseup 이벤트 리스너 추가
   * 3. 마우스 이동에 따라 크기 계산 및 업데이트
   * 4. 마우스 업에서 리스너 제거
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (!imageRef.current) return

      const rect = imageRef.current.getBoundingClientRect()
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      }

      setIsResizing(true)
      setCurrentSize({ width: Math.round(rect.width), height: Math.round(rect.height) })

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 마우스 이동량 계산
        const deltaX = moveEvent.clientX - startPos.current.x
        const deltaY = moveEvent.clientY - startPos.current.y

        let newWidth = startPos.current.width
        let newHeight = startPos.current.height

        /**
         * 📌 핸들 종류에 따라 다른 동작
         *
         * 일상생활 비유:
         * - 파워포인트에서 모서리를 잡으면 가로+세로가 같이 변하고,
         * - 변 중앙을 잡으면 한 방향만 변하는 것과 같아요!
         */
        if (corner === "middle-right") {
          // 📌 오른쪽 중앙 핸들: 가로만 조절
          newWidth = startPos.current.width + deltaX
        } else if (corner === "middle-bottom") {
          // 📌 아래쪽 중앙 핸들: 세로만 조절
          newHeight = startPos.current.height + deltaY
        } else {
          // 📌 모서리 핸들: 가로+세로 동시 조절
          newWidth = startPos.current.width + deltaX
          newHeight = startPos.current.height + deltaY

          // Shift 키를 누르면 비율 유지 (모서리에서만 동작)
          if (moveEvent.shiftKey) {
            const aspectRatio = startPos.current.width / startPos.current.height
            newHeight = newWidth / aspectRatio
          }
        }

        // 최소/최대 크기 제한 (너무 작거나 크면 안 됨)
        newWidth = Math.max(50, Math.min(newWidth, 800))
        newHeight = Math.max(50, Math.min(newHeight, 800))

        // 현재 크기 표시 업데이트 (툴팁용)
        setCurrentSize({ width: Math.round(newWidth), height: Math.round(newHeight) })

        // 이미지 속성 업데이트 (실제 크기 변경)
        updateAttributes({
          width: `${Math.round(newWidth)}px`,
          height: `${Math.round(newHeight)}px`,
        })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [updateAttributes]
  )

  /**
   * 📌 더블클릭: 원본 크기로 복원
   * 마치 사진 앱에서 "원본 크기로" 버튼을 누르는 것과 같아요
   */
  const handleDoubleClick = useCallback(() => {
    updateAttributes({ width: null, height: null })
  }, [updateAttributes])

  /**
   * 이미지 정렬 변경
   */
  const setAlignment = useCallback(
    (align: "left" | "center" | "right") => {
      updateAttributes({ alignment: align })
    },
    [updateAttributes]
  )

  // 📌 정렬에 따른 CSS 클래스 (flexbox 기반)
  // NodeViewWrapper가 display: flex이므로 justify 클래스 사용
  const alignmentMap: Record<string, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }
  const alignmentClass = alignmentMap[node.attrs.alignment as string] || "justify-start"

  return (
    <NodeViewWrapper className={`relative my-2 ${alignmentClass}`}>
      {/* 이미지 컨테이너 */}
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{
            width: node.attrs.width || "auto",
            height: node.attrs.height || "auto",
          }}
          onDoubleClick={handleDoubleClick}
          className={`max-w-full cursor-pointer rounded-lg transition-shadow ${
            selected ? "ring-primary ring-2 ring-offset-2" : ""
          }`}
          draggable={false}
        />

        {/* 📌 리사이즈 핸들 - 이미지 선택 시에만 표시 */}
        {selected && (
          <>
            {/* 모서리 핸들 (대각선 조절) */}
            {/* 우상단 핸들 */}
            <div
              className="image-resize-handle top-right"
              onMouseDown={(e) => handleMouseDown(e, "top-right")}
            />
            {/* 좌하단 핸들 */}
            <div
              className="image-resize-handle bottom-left"
              onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
            />
            {/* 우하단 핸들 */}
            <div
              className="image-resize-handle bottom-right"
              onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
            />

            {/* 📌 NEW: 변 중앙 핸들 (개별 방향 조절) */}
            {/* 오른쪽 중앙 핸들 (가로만 조절) */}
            <div
              className="image-resize-handle middle-right"
              onMouseDown={(e) => handleMouseDown(e, "middle-right")}
            />
            {/* 아래쪽 중앙 핸들 (세로만 조절) */}
            <div
              className="image-resize-handle middle-bottom"
              onMouseDown={(e) => handleMouseDown(e, "middle-bottom")}
            />
          </>
        )}

        {/* 📌 크기 표시 툴팁 - 리사이즈 중에만 표시 */}
        {isResizing && (
          <div className="image-size-tooltip">
            {currentSize.width} × {currentSize.height}
          </div>
        )}

        {/* 📌 이미지 편집 툴바 - 선택 시에만 표시 */}
        {selected && !isResizing && (
          <div className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-white px-2 py-1.5 shadow-lg">
            {/* 정렬 버튼 */}
            <button
              type="button"
              onClick={() => setAlignment("left")}
              className={`rounded p-1.5 hover:bg-gray-100 ${
                node.attrs.alignment === "left" ? "bg-gray-200" : ""
              }`}
              title="왼쪽 정렬"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlignment("center")}
              className={`rounded p-1.5 hover:bg-gray-100 ${
                node.attrs.alignment === "center" ? "bg-gray-200" : ""
              }`}
              title="가운데 정렬"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlignment("right")}
              className={`rounded p-1.5 hover:bg-gray-100 ${
                node.attrs.alignment === "right" ? "bg-gray-200" : ""
              }`}
              title="오른쪽 정렬"
            >
              <AlignRight className="h-4 w-4" />
            </button>

            <div className="mx-1 h-5 w-px bg-gray-200" />

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => deleteNode()}
              className="rounded p-1.5 text-red-500 hover:bg-gray-100"
              title="이미지 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
