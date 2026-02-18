"use client"

/**
 * 📌 에디터 툴바 - 서식 버튼들을 모아놓은 도구 모음
 *
 * 일상생활 비유:
 * 워드 프로세서의 상단에 있는 리본 메뉴처럼,
 * 글자 크기, 색상, 정렬 등 모든 편집 도구가 모여있는 곳이에요.
 */

import { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Upload,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

// 하위 컴포넌트 import
import { ToolbarButton, Divider } from "./ToolbarButton"
import { InlineColorPicker } from "./InlineColorPicker"
import { FontSizeSelector } from "./FontSizeSelector"
import { FontFamilySelector } from "./FontFamilySelector"
import { TableGridPicker } from "./TableGridPicker"
import { ImageMediaMenu } from "./ImageMediaMenu"

export function EditorToolbar({
  editor,
  onImageUpload,
  isUploading,
  onSelectMediaImages,
}: {
  editor: Editor | null
  onImageUpload: () => void
  isUploading: boolean
  onSelectMediaImages: (type: "slider" | "gallery") => void
}) {
  if (!editor) return null

  // 링크 추가 함수
  const addLink = () => {
    const url = prompt("링크 URL을 입력하세요:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="space-y-2 rounded-t-lg border-b border-gray-200 bg-gray-50 p-2">
      {/* 첫 번째 줄: 기본 서식 버튼 */}
      <div className="flex flex-wrap items-center gap-1">
        {/* 실행 취소/다시 실행 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* 제목 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="제목 1 (Ctrl+Alt+1)"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="제목 2 (Ctrl+Alt+2)"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* 텍스트 서식 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="굵게 (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="기울임 (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="밑줄 (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* 글씨 크기 */}
        <FontSizeSelector editor={editor} />

        {/* 📌 폰트 선택 */}
        <FontFamilySelector editor={editor} />

        <Divider />

        {/* 목록 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="글머리 기호 목록"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="번호 매기기 목록"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* 📌 글자 정렬 - 텍스트를 왼쪽/가운데/오른쪽으로 정렬 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="왼쪽 정렬"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="가운데 정렬"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="오른쪽 정렬"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* 링크 & 이미지 */}
        <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="링크 삽입">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={onImageUpload}
          disabled={isUploading}
          title="이미지 업로드 (여러 장 선택 가능)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </ToolbarButton>

        <Divider />

        {/* 📌 테이블 그리드 피커 */}
        <TableGridPicker editor={editor} />

        {/* 📌 슬라이드/갤러리 메뉴 */}
        <ImageMediaMenu editor={editor} onSelectImages={onSelectMediaImages} />
      </div>

      {/* 두 번째 줄: 인라인 컬러 피커 */}
      <div className="flex flex-wrap gap-2">
        <InlineColorPicker editor={editor} type="text" label="글자색" />
        <InlineColorPicker editor={editor} type="highlight" label="형광펜" />
      </div>
    </div>
  )
}
