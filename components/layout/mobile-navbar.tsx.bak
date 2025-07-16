// components/layout/mobile-navbar.tsx - Version compacte
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Briefcase, Users, MessageCircle, User, LogOut } from 'lucide-react'
import { useUser } from '../providers/user-provider'
import { supabase } from '@/lib/supabase'


export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, loading } = useUser()

  const isActive = (path: string) => pathname === path

  const menuItems = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/projects', label: 'Projets', icon: Briefcase },
    { href: '/developers', label: 'Développeurs', icon: Users },
    ...(user ? [
      { href: '/messages', label: 'Messages', icon: MessageCircle },
      { 
        href: user.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer', 
        label: 'Dashboard', 
        icon: User 
      },
    ] : [])
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  // Affichage pendant le chargement
  if (loading) {
    return (
      <nav className="lg:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/30 sticky top-0 z-50">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="text-lg font-semibold text-white">Linkerai</span>
            </Link>
            <div className="w-5 h-5 animate-pulse bg-slate-700 rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Navigation mobile compacte */}
      <nav className="lg:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/30 sticky top-0 z-50">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            {/* Logo compact */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="text-lg font-semibold text-white">Linkerai</span>
            </Link>

            {/* Menu burger compact */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu déroulant */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900/98 backdrop-blur-md border-b border-slate-700/50 shadow-xl">
            <div className="px-3 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}

              {/* Actions utilisateur */}
              <div className="pt-3 border-t border-slate-700/50">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <p className="text-xs text-slate-500">Connecté</p>
                      <p className="text-sm font-medium text-white truncate">
                        {profile?.full_name || user.email}
                      </p>
                      <p className="text-xs text-blue-400 capitalize">
                        {profile?.user_type || 'Utilisateur'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-all"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center text-sm font-medium"
                    >
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom bar compacte pour utilisateurs connectés */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/30 z-50">
          <div className="flex items-center justify-around py-1 pb-safe-area-inset-bottom">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-md transition-all min-w-0 ${
                    isActive(item.href)
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate max-w-14">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
