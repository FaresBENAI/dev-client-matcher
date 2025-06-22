import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/layout/auth-context'
import Navbar from '@/components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LinkerAI - Connectez développeurs et projets',
  description: 'Plateforme intelligente pour connecter développeurs talentueux et projets innovants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
