/**
 * 이미지 갤러리 다이얼로그
 * Embla Carousel 기반 좌/우 슬라이드, 하단 카운터 + 다운로드
 * 사용처: products/page.tsx 썸네일 클릭 시
 */
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { Download, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { getSupabase } from '@/lib/supabase/client'
import type { FileInfo } from '@/components/ui/FileUpload'

interface ImageGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: FileInfo[]
  bucketName: string
  initialIndex?: number
}

export default function ImageGalleryDialog({
  open,
  onOpenChange,
  images,
  bucketName,
  initialIndex = 0,
}: ImageGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [api, setApi] = useState<CarouselApi>()

  // signed URL 배치 조회 (다이얼로그 열릴 때만 실행)
  // queryKey에 images의 path 배열을 포함하여 이미지 목록이 바뀌면 재조회
  const imagePaths = images.map(img => img.path).join(',')
  const { data: signedUrls = [], isLoading } = useQuery({
    queryKey: ['imageGallery-signedUrls', bucketName, imagePaths],
    queryFn: async () => {
      const supabase = getSupabase()
      const paths = images.map(img => img.path)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrls(paths, 3600) // 1시간 유효

      if (!error && data) {
        return data.map(d => d.signedUrl)
      }
      return [] as string[]
    },
    enabled: open && images.length > 0,
    // signed URL은 1시간 유효 → 50분마다 갱신
    staleTime: 50 * 60 * 1000,
  })

  // 열릴 때 초기 인덱스 설정
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  // Carousel API 연결 후 초기 슬라이드 이동
  useEffect(() => {
    if (!api) return
    api.scrollTo(initialIndex, true)
  }, [api, initialIndex])

  // 슬라이드 변경 감지
  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap())
    }

    api.on('select', onSelect)
    return () => { api.off('select', onSelect) }
  }, [api])

  if (images.length === 0) return null

  const currentImage = images[currentIndex]
  const currentUrl = signedUrls[currentIndex]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-black/95 border-none overflow-hidden">
        <DialogTitle className="sr-only">이미지 갤러리</DialogTitle>

        {/* 닫기 버튼 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="relative">
            {/* 캐러셀 */}
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {images.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <div className="flex items-center justify-center h-[60vh] p-4">
                      {signedUrls[idx] ? (
                        <Image
                          src={signedUrls[idx]}
                          alt={img.name}
                          width={800}
                          height={600}
                          className="max-w-full max-h-full object-contain rounded"
                          unoptimized
                        />
                      ) : (
                        <div className="text-white/30 text-sm">이미지를 불러올 수 없습니다.</div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* 좌우 화살표 (2장 이상일 때만) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => api?.scrollPrev()}
                  disabled={!api?.canScrollPrev()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  disabled={!api?.canScrollNext()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 하단 정보 바 */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80">
          <div className="flex items-center gap-3 text-white/70 text-sm">
            {images.length > 1 && (
              <span className="text-white font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            )}
            <span className="truncate max-w-[200px]">{currentImage?.name}</span>
          </div>
          {currentUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <a href={currentUrl} download={currentImage?.name}>
                <Download className="w-4 h-4 mr-1.5" />
                다운로드
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
