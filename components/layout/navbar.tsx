'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pagesMenuOpen, setPagesMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const pagesMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
        fetchUnreadCount(user.id)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        getUser()
      } else {
        setUser(null)
        setUserProfile(null)
        setUnreadCount(0)
      }
    })

    // Fermer les menus si click à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (pagesMenuRef.current && !pagesMenuRef.current.contains(event.target as Node)) {
        setPagesMenuOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUnreadCount = async (userId: string) => {
    try {
      // Récupérer les conversations de l'utilisateur
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`)

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        
        // Compter les messages non lus
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', userId)

        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfileMenuOpen(false)
  }

  const pagesMenuItems = [
    { label: 'Accueil', href: '/', icon: '🏠' },
    { label: 'Développeurs', href: '/developers', icon: '💻' },
    { label: 'Projets', href: '/projects', icon: '🚀' },
    ...(user && userProfile ? [
      { label: 'Messages', href: '/messages', icon: '💬', badge: unreadCount },
      userProfile.user_type === 'client' 
        ? { label: 'Dashboard Client', href: '/dashboard/client', icon: '👔' }
        : { label: 'Dashboard Développeur', href: '/dashboard/developer', icon: '💻' }
    ] : [])
  ]

  const profileMenuItems = user && userProfile ? [
    { label: 'Messages', href: '/messages', icon: '💬', badge: unreadCount },
    ...(userProfile.user_type === 'client' ? [
      { label: 'Mon Dashboard', href: '/dashboard/client', icon: '📊' },
      { label: 'Mes Projets', href: '/dashboard/client/projects', icon: '📋' },
      { label: 'Créer un Projet', href: '/dashboard/client/create-project', icon: '✨' },
      { label: 'Mon Profil', href: '/dashboard/client/profile', icon: '⚙️' }
    ] : [
      { label: 'Mon Dashboard', href: '/dashboard/developer', icon: '📊' },
      { label: 'Mes Candidatures', href: '/dashboard/developer/applications', icon: '📝' },
      { label: 'Mon Profil', href: '/dashboard/developer/profile', icon: '⚙️' }
    ]),
    { label: 'Se déconnecter', href: '#', icon: '🚪', action: 'logout' }
  ] : []

  return (
    <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Menu Pages */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold">
              <span className="text-white">🚀 </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Dev-Client Matcher
              </span>
            </Link>

            {/* Menu Pages Dropdown */}
            <div className="relative" ref={pagesMenuRef}>
              <button
                onClick={() => setPagesMenuOpen(!pagesMenuOpen)}
                className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md"
              >
                <span>Navigation</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${pagesMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {pagesMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
                  <div className="py-2">
                    {pagesMenuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={() => setPagesMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lien Messages direct pour desktop */}
            {user && (
              <Link 
                href="/messages" 
                className="hidden md:flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md relative"
              >
                <span>💬</span>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-32 h-8 bg-slate-800 animate-pulse rounded"></div>
            ) : user && userProfile ? (
              /* Menu Profil Connecté */
              <div className="flex items-center space-x-4">
                {/* Indicateur type utilisateur */}
                <span className="hidden md:block px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs border border-slate-700">
                  {userProfile.user_type === 'client' ? '👔 Client' : '💻 Développeur'}
                </span>

                {/* Menu Profil Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {userProfile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block font-medium">
                      {userProfile.full_name || user.email}
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
                      {/* Header du menu */}
                      <div className="px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {userProfile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {userProfile.full_name || 'Utilisateur'}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items du menu */}
                      <div className="py-2">
                        {profileMenuItems.map((item, index) => (
                          <div key={index}>
                            {item.action === 'logout' ? (
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-left"
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={() => setProfileMenuOpen(false)}
                                className="flex items-center justify-between px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{item.icon}</span>
                                  <span>{item.label}</span>
                                </div>
                                {item.badge && item.badge > 0 && (
                                  <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Boutons pour visiteurs */
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-slate-800"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white">
                    Inscription
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
