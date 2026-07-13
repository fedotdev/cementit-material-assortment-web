import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Цементит — справочник сортаментов металлопроката',
  description:
    'Актуальные сортаменты металлопроката: ГОСТ, ISO, EN и GB аналоги, статусы стандартов, подбор по размерам и генератор записи для КД.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`bg-background ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased font-sans">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <p className="border-b border-border bg-surface-secondary px-4 py-1.5 text-center text-xs text-muted">
              Демо-данные. Не использовать в производстве без проверки по актуальным НД.
            </p>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-6">
              <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-xs text-muted">
                <p>Цементит — инженерный справочник сортаментов. Демо-данные, не для применения в производстве без проверки.</p>
              </div>
            </footer>
          </div>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
