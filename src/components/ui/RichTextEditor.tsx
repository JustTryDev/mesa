"use client"

/**
 * TipTap 기반 리치 텍스트 에디터 컴포넌트 (고급 버전)
 *
 * 📌 리치 텍스트 에디터란?
 * 마치 워드(Word)나 한글처럼 글자를 굵게, 기울게, 목록으로 만들 수 있는
 * 텍스트 편집기입니다. 일반 텍스트 입력창보다 다양한 서식을 적용할 수 있어요.
 *
 * 지원 기능:
 * - 기본 서식: 굵게, 기울임, 밑줄
 * - 제목: H1, H2
 * - 목록: 글머리 기호, 번호 목록
 * - 글씨 색상: 인라인 팔레트 + 최근 사용 색상
 * - 형광펜: 인라인 팔레트 + 최근 사용 색상
 * - 글씨 크기: 8개 프리셋 + 직접 입력
 * - 링크 삽입
 * - 이미지: 드래그 앤 드롭 업로드 + 리사이즈 핸들
 *
 * 📌 파일 구조:
 * 이 파일은 "조합 컴포넌트" 역할입니다. 세부 기능들은 rich-text/ 폴더에 분리되어 있어요.
 * - rich-text/types.ts         — 타입 정의
 * - rich-text/constants.ts     — 상수 (폰트, 크기, 색상)
 * - rich-text/extensions.ts    — TipTap 커스텀 확장 (FontSize, ResizableImage, CustomTableCell)
 * - rich-text/EditorToolbar.tsx — 서식 도구 모음
 * - rich-text/TableFloatingToolbar.tsx — 테이블 편집 플로팅 메뉴
 * - rich-text/ResizableImageComponent.tsx — 이미지 리사이즈 NodeView
 * - rich-text/InlineColorPicker.tsx — 글자색/형광펜 색상 피커
 * - rich-text/FontSizeSelector.tsx — 글씨 크기 선택기
 * - rich-text/FontFamilySelector.tsx — 폰트 선택기
 * - rich-text/TableGridPicker.tsx — 테이블 삽입 그리드
 * - rich-text/ImageMediaMenu.tsx — 슬라이드/갤러리 메뉴
 * - rich-text/ToolbarButton.tsx — 툴바 기본 버튼
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import { TableKit } from "@tiptap/extension-table"
import FontFamily from "@tiptap/extension-font-family"
import { Upload, Loader2 } from "lucide-react"
import { compressImage } from "@/lib/imageCompressor"

// 📌 슬라이드/갤러리 이미지 확장
import { ImageSlider } from "./editor/ImageSliderExtension"
import { ImageGallery } from "./editor/ImageGalleryExtension"

// 📌 분리된 하위 모듈 import
import type { RichTextEditorProps, UploadProgress } from "./rich-text/types"
import { FontSize, ResizableImage, CustomTableCell } from "./rich-text/extensions"
import { EditorToolbar } from "./rich-text/EditorToolbar"
import { TableFloatingToolbar } from "./rich-text/TableFloatingToolbar"

// ========================================
// 메인 에디터 컴포넌트
// ========================================

/**
 * 리치 텍스트 에디터 메인 컴포넌트
 *
 * 📌 사용 예시:
 * ```tsx
 * <RichTextEditor
 *   content={htmlContent}
 *   onChange={(html) => setHtmlContent(html)}
 *   placeholder="공지사항 내용을 입력하세요..."
 * />
 * ```
 */
export function RichTextEditor({
  content,
  onChange,
  placeholder = "내용을 입력하세요...",
}: RichTextEditorProps) {
  // 이미지 업로드 상태
  const [isUploading, setIsUploading] = useState(false)
  // 📌 업로드 진행 상태 (현재 파일 번호, 전체 수, 파일명)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  // 📌 드래그 앤 드롭 상태
  const [isDragging, setIsDragging] = useState(false)
  // 드래그 진입 횟수 카운터 (중첩된 요소 때문에 필요)
  const dragCounter = useRef(0)
  // 파일 입력 요소 참조
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 📌 멀티 이미지용 파일 입력 참조
  const mediaFileInputRef = useRef<HTMLInputElement>(null)
  // 📌 멀티 이미지 타입 (slider 또는 gallery)
  const [mediaType, setMediaType] = useState<"slider" | "gallery" | null>(null)
  // 📌 에디터 ref - 다중 이미지 업로드 버그 수정용
  // 왜 필요한가요? useCallback 안에서 editor를 직접 사용하면 "stale closure" 문제가 생길 수 있어요.
  // ref를 사용하면 항상 최신 editor 인스턴스를 참조할 수 있습니다.
  const editorRef = useRef<Editor | null>(null)

  // TipTap 에디터 인스턴스 생성
  const editor = useEditor({
    extensions: [
      // 📌 StarterKit에 Link, Underline이 포함됨 (Tiptap v3)
      // Link 설정은 StarterKit.configure 내에서 지정
      StarterKit.configure({
        link: {
          openOnClick: false,
        },
      }),
      ResizableImage, // 📌 리사이즈 가능한 이미지 확장
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // 📌 텍스트 정렬 확장 - 워드처럼 텍스트를 정렬할 수 있어요
      TextAlign.configure({
        types: ["heading", "paragraph"], // 제목과 문단에 정렬 적용 가능
      }),
      // 📌 테이블 확장 - 워드처럼 표를 만들 수 있어요
      // 기본 tableCell을 비활성화하고 커스텀 TableCell 사용
      TableKit.configure({
        tableCell: false,
      }),
      // 📌 커스텀 TableCell - 배경색 속성 지원
      CustomTableCell,
      // 📌 폰트 확장 - 다양한 글꼴을 선택할 수 있어요
      FontFamily,
      // 📌 슬라이드/갤러리 이미지 확장
      ImageSlider,
      ImageGallery,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
    immediatelyRender: false,
  })

  /**
   * 📌 에디터 ref 동기화
   *
   * 왜 필요한가요?
   * - useCallback 안에서 editor를 직접 사용하면 "stale closure" 문제가 생겨요.
   * - 마치 사진을 찍으면 그 순간이 고정되듯이, useCallback도 만들어질 때의 값을 기억해요.
   * - 그래서 editor가 나중에 바뀌어도 옛날 값을 계속 참조하는 문제가 생겨요.
   * - ref를 사용하면 항상 "현재" editor를 가리키기 때문에 이 문제가 해결됩니다!
   */
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  /**
   * 📌 content prop 동기화
   *
   * 왜 필요한가요?
   * - TipTap의 useEditor는 content를 "초기값"으로만 사용해요.
   * - 마치 useState(초기값)처럼, 나중에 prop이 바뀌어도 자동 반영 안 돼요.
   * - 그래서 prop이 바뀌면 setContent 명령어로 직접 업데이트해야 해요!
   *
   * 일상생활 비유:
   * - TV가 켜진 후에도 리모컨으로 채널을 바꿀 수 있게 해주는 기능이에요.
   * - 처음 TV를 켰을 때 1번 채널이 나오더라도,
   *   나중에 리모컨으로 "5번!"이라고 하면 바꿔주는 것처럼요.
   */
  useEffect(() => {
    // 에디터가 아직 준비 안 됐으면 무시
    if (!editor) return

    // 📌 무한 루프 방지: 현재 내용과 같으면 건너뛰기
    // (setContent → onUpdate → onChange → content prop 변경 → setContent... 방지)
    const currentContent = editor.getHTML()
    if (currentContent === content) return

    // 📌 에디터 내용 업데이트
    editor.commands.setContent(content)
  }, [editor, content])

  /**
   * 📌 이미지 업로드 함수 (다중 파일 지원)
   *
   * 작동 순서:
   * 1. 이미지 파일만 필터링
   * 2. 각 파일마다: 압축 → URL 발급 → 업로드 → URL 수집
   * 3. 마지막에 모든 이미지를 한 번에 삽입
   *
   * 📌 왜 배열로 한 번에 삽입하나요?
   * for 루프에서 insertContent()를 매번 호출하면 ReactNodeViewRenderer와
   * ProseMirror 트랜잭션이 충돌해서 마지막 이미지만 삽입됩니다.
   * 배열로 한 번에 삽입하면 하나의 트랜잭션으로 처리되어 모든 이미지가 삽입됩니다.
   *
   * 일상생활 비유:
   * - 택배 10개를 한 개씩 10번 보내기 → 배송 충돌 가능
   * - 택배 10개를 한 박스에 넣어서 1번 보내기 → 확실히 도착
   */
  const uploadImages = useCallback(
    async (files: File[]) => {
      // 📌 editorRef.current를 사용해서 최신 editor 참조
      const currentEditor = editorRef.current
      if (!currentEditor || files.length === 0) return

      // 이미지 파일만 필터링
      const imageFiles = files.filter((file) => file.type.startsWith("image/"))

      if (imageFiles.length === 0) {
        toast.warning("이미지 파일만 업로드할 수 있습니다.")
        return
      }

      setIsUploading(true)

      // 📌 1단계: 모든 이미지 URL을 먼저 수집
      const uploadedImageUrls: string[] = []

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]

        try {
          // 진행률 업데이트 (UI 표시용)
          setUploadProgress({
            current: i + 1,
            total: imageFiles.length,
            fileName: file.name,
          })

          // 1. 이미지 압축
          const compressed = await compressImage(file)

          // 2. Presigned URL 발급
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileExtension: "jpg",
              contentType: "image/jpeg",
              folder: "announcement-images",
            }),
          })

          if (!res.ok) {
            throw new Error("업로드 URL 발급 실패")
          }

          const { uploadUrl, imageUrl } = await res.json()

          // 3. R2 스토리지에 업로드
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: compressed,
            headers: { "Content-Type": "image/jpeg" },
          })

          if (!uploadRes.ok) {
            throw new Error("이미지 업로드 실패")
          }

          // 📌 URL을 배열에 추가 (아직 삽입 안 함!)
          uploadedImageUrls.push(imageUrl)
        } catch (error) {
          // 📌 개별 파일 에러는 로그만 남기고 다음 파일 계속 처리
          console.error(`이미지 업로드 실패: ${file.name}`, error)
        }
      }

      // 📌 2단계: 모든 이미지를 한 번에 삽입
      // 배열을 사용하면 TipTap이 하나의 트랜잭션으로 처리하여 충돌 없음
      if (uploadedImageUrls.length > 0) {
        currentEditor
          .chain()
          .focus()
          .insertContent(
            uploadedImageUrls.map((url) => ({
              type: "image",
              attrs: { src: url },
            }))
          )
          .run()
      }

      // 업로드 완료 처리
      setIsUploading(false)
      setUploadProgress(null)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [] // 📌 dependency 없음 - editorRef 사용으로 항상 최신 editor 참조
  )

  /**
   * 파일 입력 변경 핸들러
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadImages(Array.from(files))
  }

  /**
   * 파일 선택 다이얼로그 열기
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // ========================================
  // 📌 멀티 이미지 (슬라이드/갤러리) 핸들러
  // ========================================

  /**
   * 📌 멀티 이미지 선택 시작
   * 슬라이드 또는 갤러리 타입을 설정하고 파일 선택 다이얼로그를 엽니다.
   */
  const handleSelectMediaImages = useCallback((type: "slider" | "gallery") => {
    setMediaType(type)
    mediaFileInputRef.current?.click()
  }, [])

  /**
   * 📌 멀티 이미지 업로드 핸들러
   * 선택한 이미지들을 업로드하고 슬라이드 또는 갤러리로 삽입합니다.
   */
  const handleMediaImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0 || !mediaType) return

      const currentEditor = editorRef.current
      if (!currentEditor) return

      // 이미지 파일만 필터링
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

      if (imageFiles.length < 2) {
        toast.warning("슬라이드/갤러리는 2장 이상의 이미지가 필요합니다.")
        setMediaType(null)
        if (mediaFileInputRef.current) {
          mediaFileInputRef.current.value = ""
        }
        return
      }

      setIsUploading(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]

        try {
          setUploadProgress({
            current: i + 1,
            total: imageFiles.length,
            fileName: file.name,
          })

          // 이미지 압축
          const compressed = await compressImage(file)

          // Presigned URL 발급
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileExtension: "jpg",
              contentType: "image/jpeg",
              folder: "announcement-images",
            }),
          })

          if (!res.ok) throw new Error("업로드 URL 발급 실패")

          const { uploadUrl, imageUrl } = await res.json()

          // R2 스토리지에 업로드
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: compressed,
            headers: { "Content-Type": "image/jpeg" },
          })

          if (!uploadRes.ok) throw new Error("이미지 업로드 실패")

          uploadedUrls.push(imageUrl)
        } catch (error) {
          console.error(`이미지 업로드 실패: ${file.name}`, error)
        }
      }

      // 업로드된 이미지가 있으면 노드 삽입
      if (uploadedUrls.length >= 2) {
        // 에디터 뷰가 준비되었는지 확인
        if (currentEditor.isDestroyed || !currentEditor.view) {
          toast.warning("에디터가 준비되지 않았습니다. 다시 시도해주세요.")
          return
        }

        if (mediaType === "slider") {
          currentEditor
            .chain()
            .focus()
            .insertContent({
              type: "imageSlider",
              attrs: { images: uploadedUrls },
            })
            .run()
        } else {
          currentEditor
            .chain()
            .focus()
            .insertContent({
              type: "imageGallery",
              attrs: { images: uploadedUrls },
            })
            .run()
        }
      } else {
        toast.error("이미지 업로드에 실패했습니다. 다시 시도해주세요.")
      }

      // 상태 초기화
      setIsUploading(false)
      setUploadProgress(null)
      setMediaType(null)
      if (mediaFileInputRef.current) {
        mediaFileInputRef.current.value = ""
      }
    },
    [mediaType]
  )

  // ========================================
  // 📌 드래그 앤 드롭 핸들러
  // ========================================

  /**
   * 드래그 진입 시
   * - 파일을 드래그하면 시각적 피드백 표시
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true)
    }
  }, [])

  /**
   * 드래그 이탈 시
   * - 카운터로 중첩된 요소 처리
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  /**
   * 드래그 오버 시
   * - 기본 동작 방지 (브라우저가 파일 열지 않도록)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  /**
   * 📌 드롭 시 이미지 업로드
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter((file) => file.type.startsWith("image/"))

      if (imageFiles.length > 0) {
        await uploadImages(imageFiles)
      }
    },
    [uploadImages]
  )

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 숨겨진 파일 입력 - 일반 이미지용 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 📌 숨겨진 파일 입력 - 슬라이드/갤러리용 */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleMediaImageUpload}
        className="hidden"
      />

      {/* 📌 드래그 오버레이 - 파일 드래그 시 표시 */}
      {isDragging && (
        <div className="bg-primary/10 border-primary absolute inset-0 z-30 flex items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Upload className="text-primary mx-auto mb-2 h-10 w-10" />
            <p className="text-primary font-medium">이미지를 여기에 놓으세요</p>
          </div>
        </div>
      )}

      {/* 툴바 */}
      <EditorToolbar
        editor={editor}
        onImageUpload={triggerFileInput}
        isUploading={isUploading}
        onSelectMediaImages={handleSelectMediaImages}
      />

      {/* 📌 테이블 플로팅 툴바 - 테이블 안을 클릭하면 나타남 */}
      {/* editor.view?.docView 체크: Race Condition 방지 - 뷰가 완전히 준비된 후에만 렌더링 */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {editor && !!(editor.view as any)?.docView && <TableFloatingToolbar editor={editor} />}

      {/* 에디터 본문 */}
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
        data-placeholder={placeholder}
      />

      {/* 📌 업로드 진행률 표시 */}
      {uploadProgress && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  이미지 업로드 중 ({uploadProgress.current}/{uploadProgress.total})
                </span>
                <span className="text-gray-500">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>

              <p className="mt-1 truncate text-xs text-gray-500">{uploadProgress.fileName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
