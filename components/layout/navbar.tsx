// components/layout/navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '../ui/button'
import { supabase } from '@/lib/supabase'
import { NotificationBadge } from '../ui/notification-badge'
import { useUnreadMessages } from '../../hooks/useUnreadMessages'

// 🆕 NOUVEAU: Type pour les liens de navigation
interface NavigationLink {
  href: string;
  label: string;
  hasNotification?: boolean;
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // 🆕 NOUVEAU: Hook pour compter les messages non lus
  const { unreadCount } = useUnreadMessages()

  // 🔧 AJOUT: Fonction pour vérifier l'état de connexion
  const checkAuthState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        // Charger le profil utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name, email')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profile)
        console.log('🔄 Navbar - Utilisateur connecté:', user.email, 'Type:', profile?.user_type)
      } else {
        setUser(null)
        setUserProfile(null)
        console.log('🔄 Navbar - Aucun utilisateur connecté')
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de connexion:', error)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Vérification initiale
    checkAuthState()

    // 🔧 AJOUT: Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Navbar - Changement d\'état auth:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // Charger le profil
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type, full_name, email')
            .eq('id', session.user.id)
            .single()
          setUserProfile(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // 🔧 AJOUT: Re-vérifier l'état quand l'URL change
  useEffect(() => {
    checkAuthState()
  }, [pathname])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      router.push('/')
      router.refresh() // Force le refresh de la page
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const getDashboardLink = () => {
    if (!userProfile) return '/dashboard'
    return userProfile.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer'
  }

  // 🔧 CORRECTION: Fonction avec type NavigationLink[]
  const getNavigationLinks = (): NavigationLink[] => {
    const baseLinks: NavigationLink[] = [
      { href: '/', label: 'Accueil' },
      { href: '/projects', label: 'Projets' },
      { href: '/developers', label: 'Développeurs' }
    ]

    if (user && userProfile) {
      return [
        ...baseLinks,
        { href: '/messages', label: 'Messages', hasNotification: true }
      ]
    }

    return baseLinks
  }

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">L</span>
                </div>
                <span className="text-lg font-black text-black">LinkerAI</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">L</span>
              </div>
              <span className="text-lg font-black text-black">LinkerAI</span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {getNavigationLinks().map((link) => (
              <div key={link.href}>
                {link.hasNotification ? (
                  // 🆕 NOUVEAU: Wrapper avec badge pour les liens avec notifications
                  <NotificationBadge count={unreadCount}>
                    <Link
                      href={link.href}
                      className={`text-sm font-medium transition-colors hover:text-black ${
                        pathname === link.href ? 'text-black' : 'text-gray-600'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </NotificationBadge>
                ) : (
                  <Link
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-black ${
                      pathname === link.href ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-3">
            {user && userProfile ? (
              <>
                {/* Utilisateur connecté */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link href={getDashboardLink()}>
                    <button className="group relative bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-4 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg">
                      <span className="relative z-10 flex items-center text-white font-black">
                        Dashboard
                        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>
                    </button>
                  </Link>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {userProfile.full_name?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 font-medium max-w-20 truncate">
                      {userProfile.full_name || userProfile.email?.split('@')[0]}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="group relative border-2 border-black text-black hover:bg-black hover:text-white font-black px-4 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span className="relative z-10 flex items-center font-black">
                      Déconnexion
                    </span>
                  </button>
                </div>

                {/* Mobile - Utilisateur connecté */}
                <div className="md:hidden">
                  <Button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 p-1.5 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Visiteur non connecté */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/auth/login">
                    <button className="group relative border-2 border-black text-black hover:bg-black hover:text-white font-black px-4 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg">
                      <span className="relative z-10 flex items-center font-black">
                        Connexion
                      </span>
                    </button>
                  </Link>
                  <Link href="/auth/signup">
                    <button className="group relative bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-4 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg">
                      <span className="relative z-10 flex items-center text-white font-black">
                        S'inscrire
                        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>
                    </button>
                  </Link>
                </div>

                {/* Mobile - Visiteur */}
                <div className="md:hidden">
                  <Button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 p-1.5 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-2">
              {getNavigationLinks().map((link) => (
                <div key={link.href}>
                  {link.hasNotification ? (
                    // 🆕 NOUVEAU: Badge pour mobile aussi
                    <NotificationBadge count={unreadCount} className="inline-block">
                      <Link
                        href={link.href}
                        className={`block text-sm font-medium transition-colors hover:text-black py-1 ${
                          pathname === link.href ? 'text-black' : 'text-gray-600'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </NotificationBadge>
                  ) : (
                    <Link
                      href={link.href}
                      className={`block text-sm font-medium transition-colors hover:text-black py-1 ${
                        pathname === link.href ? 'text-black' : 'text-gray-600'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              
              {user && userProfile ? (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {userProfile.full_name?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile.full_name || userProfile.email}
                      </div>
                    </div>
                  </div>
                  
                  <Link href={getDashboardLink()}>
                    <button 
                      className="group relative w-full bg-black text-white hover:bg-gray-800 border-2 border-black font-black py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="relative z-10 flex items-center justify-center text-white font-black">
                        Mon Dashboard
                        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>
                    </button>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="group relative w-full border-2 border-black text-black hover:bg-black hover:text-white font-black py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span className="relative z-10 flex items-center justify-center font-black">
                      Déconnexion
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <Link href="/auth/login">
                    <button 
                      className="group relative w-full border-2 border-black text-black hover:bg-black hover:text-white font-black py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="relative z-10 flex items-center justify-center font-black">
                        Connexion
                      </span>
                    </button>
                  </Link>
                  <Link href="/auth/signup">
                    <button 
                      className="group relative w-full bg-black text-white hover:bg-gray-800 border-2 border-black font-black py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="relative z-10 flex items-center justify-center text-white font-black">
                        S'inscrire
                        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
