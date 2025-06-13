'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../ui/button'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UnifiedNavbar() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Erreur auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!userProfile) return '/auth/login'
    return userProfile.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer'
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="text-2xl sm:text-3xl">🤖</div>
            <div className="hidden sm:block">
              <span className="text-lg sm:text-xl font-bold text-white">Dev</span>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Client</span>
              <span className="text-lg sm:text-xl font-bold text-white">Matcher</span>
            </div>
            <div className="sm:hidden">
              <span className="text-base font-bold text-white">DCM</span>
            </div>
          </Link>

          {/* Navigation Links - Toujours visibles */}
          <div className="flex items-center space-x-1 sm:space-x-4 flex-1 justify-center">
            <Link 
              href="/" 
              className="text-slate-300 hover:text-white transition-colors duration-200 text-sm sm:text-base font-medium px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800/50"
            >
              🏠 <span className="hidden sm:inline">Accueil</span>
            </Link>
            <Link 
              href="/projects" 
              className="text-slate-300 hover:text-white transition-colors duration-200 text-sm sm:text-base font-medium px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800/50"
            >
              📋 <span className="hidden sm:inline">Projets</span>
            </Link>
            <Link 
              href="/developers" 
              className="text-slate-300 hover:text-white transition-colors duration-200 text-sm sm:text-base font-medium px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800/50"
            >
              👨‍💻 <span className="hidden sm:inline">Développeurs</span>
            </Link>
            <Link 
              href="/messages" 
              className="text-slate-300 hover:text-white transition-colors duration-200 text-sm sm:text-base font-medium px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800/50"
            >
              💬 <span className="hidden sm:inline">Messages</span>
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {loading ? (
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Dashboard Button */}
                <Link href={getDashboardLink()}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200">
                    <span className="hidden sm:inline">📊 Dashboard</span>
                    <span className="sm:hidden">📊</span>
                  </Button>
                </Link>

                {/* User Profile & Logout */}
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name || 'Utilisateur'}
                    </span>
                    <span className="text-slate-400 text-xs capitalize">
                      {userProfile?.user_type || 'Membre'}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="text-slate-400 hover:text-red-400 transition-colors duration-200 p-1 sm:p-2 rounded-lg hover:bg-slate-800/50"
                    title="Se déconnecter"
                  >
                    <span className="text-lg sm:text-xl">🚪</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Connexion</span>
                    <span className="sm:hidden">🔑</span>
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm">
                    <span className="hidden sm:inline">S'inscrire</span>
                    <span className="sm:hidden">✨</span>
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
