import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '../components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinkerAI - Plateforme de mise en relation IA & Automatisation',
  description: 'Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation. Trouvez le talent parfait pour vos projets innovants.',
  keywords: 'IA, Intelligence Artificielle, Automatisation, Développeurs, Freelance, Projets, Machine Learning, Chatbots',
  authors: [{ name: 'LinkerAI Team' }],
  openGraph: {
    title: 'LinkerAI - L\'automatisation commence ici',
    description: 'Plateforme de mise en relation entre clients et développeurs spécialisés en IA et automatisation',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://linkerai.app',
    siteName: 'LinkerAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkerAI - Connectez-vous avec les meilleurs talents en IA'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkerAI - L\'automatisation commence ici',
    description: 'Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} antialiased bg-white text-gray-900`}>
        {/* 🔧 CORRECTION: Navbar compacte avec synchronisation d'authentification */}
        <Navbar />
        
        {/* Contenu principal */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Footer compact */}
        <footer className="bg-black text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo et description */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-black text-xs">L</span>
                  </div>
                  <span className="text-lg font-black text-white">LinkerAI</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation.
                </p>
              </div>
              
              {/* Liens rapides */}
              <div>
                <h3 className="text-white font-bold text-sm mb-3">Plateforme</h3>
                <ul className="space-y-1">
                  <li><a href="/projects" className="text-gray-400 hover:text-white transition-colors text-sm">Projets</a></li>
                  <li><a href="/developers" className="text-gray-400 hover:text-white transition-colors text-sm">Développeurs</a></li>
                  <li><a href="/auth/signup" className="text-gray-400 hover:text-white transition-colors text-sm">S'inscrire</a></li>
                  <li><a href="/auth/login" className="text-gray-400 hover:text-white transition-colors text-sm">Se connecter</a></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h3 className="text-white font-bold text-sm mb-3">Support</h3>
                <ul className="space-y-1">
                  <li><a href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">Centre d'aide</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</a></li>
                  <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Confidentialité</a></li>
                  <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">CGU</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-xs">
                © 2024 LinkerAI. Tous droits réservés.
              </p>
              <p className="text-gray-400 text-xs mt-2 md:mt-0">
                Fait avec ❤️ pour connecter les talents
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
