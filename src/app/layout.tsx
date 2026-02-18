import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import QueryProvider from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://mesa-azure.vercel.app'),
  title: {
    default: 'MESA | 한양대학교 신소재공학부 학술동아리',
    template: '%s | MESA',
  },
  description:
    'MESA(Materials Science & Engineering Study Association) - 한양대학교 신소재공학부 학술동아리. 반도체·배터리·디스플레이·철강 등 재료 공학을 탐구합니다.',
  keywords: ['MESA', '한양대학교', '신소재공학부', '학술동아리', '재료공학'],
  icons: {
    icon: '/image/파비콘.jpg',
    apple: '/image/파비콘.jpg',
  },
  openGraph: {
    title: 'MESA | 한양대학교 신소재공학부 학술동아리',
    description:
      'MESA(Materials Science & Engineering Study Association) - 한양대학교 신소재공학부 학술동아리. 반도체·배터리·디스플레이·철강 등 재료 공학을 탐구합니다.',
    images: [{ url: 'https://mesa-azure.vercel.app/image/blacklogo.png', width: 600, height: 200, alt: 'MESA Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MESA | 한양대학교 신소재공학부 학술동아리',
    description:
      'MESA(Materials Science & Engineering Study Association) - 한양대학교 신소재공학부 학술동아리.',
    images: ['https://mesa-azure.vercel.app/image/blacklogo.png'],
  },
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
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{ duration: 3000 }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
