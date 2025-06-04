import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '../components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dev-Client Matcher',
  description: 'Plateforme de mise en relation développeurs et clients pour automatisation et IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
