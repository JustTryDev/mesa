'use client'

import { Instagram, ExternalLink, Youtube, Mail } from 'lucide-react'
import Image from 'next/image'
import { SNS_LINKS, MESA_INFO } from '@/lib/constants/mesa'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * 푸터 컴포넌트
 *
 * 비유: 책의 맨 뒷장에 있는 출판 정보와 같습니다.
 * 연락처, SNS, 저작권 등 사이트의 기본 정보를 담고 있습니다.
 */

/** SNS 플랫폼별 아이콘 매핑 */
const snsIcons = {
  instagram: Instagram,
  'naver-cafe': ExternalLink,
  youtube: Youtube,
  email: Mail,
}

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* 로고 + 소개 */}
          <div className="md:col-span-1">
            {/* 로고 — 어두운 배경이므로 흰색 로고 사용 */}
            <div className="relative h-8 w-[120px] mb-3">
              <Image
                src="/image/whitelogo.png"
                alt="MESA"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">
              {MESA_INFO.fullName}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {MESA_INFO.university} {MESA_INFO.department}
            </p>
          </div>

          {/* 연락처 */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              {t.footer.contact}
            </h3>
            <a
              href={`mailto:${MESA_INFO.email}`}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              {MESA_INFO.email}
            </a>
          </div>

          {/* SNS 링크 */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              {t.footer.social}
            </h3>
            <div className="flex items-center gap-3">
              {SNS_LINKS.map((link) => {
                const Icon = snsIcons[link.platform]
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    aria-label={link.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} MESA. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
