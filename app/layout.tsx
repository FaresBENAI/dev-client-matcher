import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import Navbar from '../components/layout/navbar'
import MobileNavbar from '../components/layout/mobile-navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dev-Client Matcher',
  description: 'Plateforme de mise en relation développeurs et clients pour automatisation et IA',
}

// ✅ AJOUT CRUCIAL : Configuration du viewport
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
        {/* Navbar desktop (cachée sur mobile) */}
        <div className="hidden lg:block">
          <Navbar />
        </div>
        
        {/* Navbar mobile (cachée sur desktop) */}
        <MobileNavbar />
        
        <main>{children}</main>
      </body>
    </html>
  )
}