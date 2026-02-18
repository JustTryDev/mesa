/**
 * Cloudflare R2 이미지 업로드 API
 * Presigned URL 발급 및 업로드 처리
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '@/lib/auth/api-auth'
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  // 인증 확인 (로그인 사용자만 업로드 가능)
  const auth = await requireAuth()
  if (!auth.success) {
    return auth.response
  }

  try {
    // 환경변수 검증은 getR2Client() 내부에서 자동 처리됨
    const body = await request.json()
    const { fileExtension, contentType, folder = 'images' } = body

    // 고유한 파일명 생성
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`

    // Presigned URL 생성
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })

    // 공개 URL 생성
    const imageUrl = `${R2_PUBLIC_URL}/${fileName}`

    return NextResponse.json({
      uploadUrl,
      imageUrl,
      fileName,
    })
  } catch (error) {
    console.error('R2 업로드 URL 생성 실패:', error)
    return NextResponse.json(
      { error: '업로드 URL 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
