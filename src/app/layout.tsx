import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

// TODO: 프로젝트에 맞게 메타데이터 수정
export const metadata: Metadata = {
  title: {
    default: 'My Project',
    template: '%s | My Project',
  },
  description: 'Next.js Admin Starter Kit',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              closeButton
              theme="light"
              toastOptions={{ duration: 3000 }}
            />
          </AuthProvider>
        </QueryProvider>
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            이 사이트를 이용하려면 JavaScript를 활성화해 주세요.
          </div>
        </noscript>
      </body>
    </html>
  )
}
