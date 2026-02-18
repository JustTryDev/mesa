'use client'

import { Instagram, Coffee, Youtube, Mail, Phone } from 'lucide-react'
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
  'naver-cafe': Coffee,
  youtube: Youtube,
  email: Mail,
}

/** 회장단 연락처 */
const LEADER_CONTACTS = [
  { name: '이준서', role: '회장', phone: '010-2213-2385' },
  { name: '김훈종', role: '부회장', phone: '010-6643-2563' },
  { name: '심은서', role: '부회장', phone: '010-7175-6136' },
  { name: '김도관', role: '총무', phone: '010-5570-8495' },
]

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* 로고 + 소개 */}
          <div>
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

          {/* 연락처 — 이메일 + 인스타그램 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              {t.footer.contact}
            </h3>
            <div className="space-y-3">
              <a
                href={`mailto:${MESA_INFO.email}`}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {MESA_INFO.email}
              </a>
              <a
                href="https://www.instagram.com/hyu_mesa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4 shrink-0" />
                @hyu_mesa
              </a>
            </div>
          </div>

          {/* 회장단 연락처 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              Executive
            </h3>
            <div className="space-y-2">
              {LEADER_CONTACTS.map((leader) => (
                <a
                  key={leader.name}
                  href={`tel:${leader.phone.replace(/-/g, '')}`}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {leader.name} {leader.role}
                    <span className="ml-2 text-zinc-600">{leader.phone}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* SNS 링크 */}
          <div>
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
