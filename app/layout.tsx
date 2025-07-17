// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import UnifiedNavbar from '@/components/layout/unified-navbar'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinkerAI - Plateforme de mise en relation',
  description: 'Connectez clients et développeurs sur LinkerAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <LanguageProvider>
          <UnifiedNavbar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
