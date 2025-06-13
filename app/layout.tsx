import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import UnifiedNavbar from '../components/layout/unified-navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dev-Client Matcher',
  description: 'Plateforme de mise en relation développeurs et clients pour automatisation et IA',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* Navbar unifiée - responsive */}
        <UnifiedNavbar />
        
        <main>{children}</main>
      </body>
    </html>
  )
}
