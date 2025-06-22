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
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo LinkerAI - Style Uber */}
          <Link href="/" className="flex items-center flex-shrink-0 group">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-lg sm:text-xl">L</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-black group-hover:text-gray-700 transition-colors duration-300">
                LinkerAI
              </div>
            </div>
          </Link>

          {/* Navigation Links - Style Uber */}
          <div className="flex items-center space-x-1 sm:space-x-4 flex-1 justify-center">
            <Link 
              href="/" 
              className="text-black hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base font-bold px-3 sm:px-4 py-2 rounded-lg border-2 border-transparent hover:border-black transform hover:scale-105"
            >
              <span className="hidden sm:inline">Accueil</span>
              <span className="sm:hidden">🏠</span>
            </Link>
            <Link 
              href="/projects" 
              className="text-black hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base font-bold px-3 sm:px-4 py-2 rounded-lg border-2 border-transparent hover:border-black transform hover:scale-105"
            >
              <span className="hidden sm:inline">Projets</span>
              <span className="sm:hidden">📋</span>
            </Link>
            <Link 
              href="/developers" 
              className="text-black hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base font-bold px-3 sm:px-4 py-2 rounded-lg border-2 border-transparent hover:border-black transform hover:scale-105"
            >
              <span className="hidden sm:inline">Développeurs</span>
              <span className="sm:hidden">👨‍💻</span>
            </Link>
            <Link 
              href="/messages" 
              className="text-black hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base font-bold px-3 sm:px-4 py-2 rounded-lg border-2 border-transparent hover:border-black transform hover:scale-105"
            >
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">💬</span>
            </Link>
          </div>

          {/* Auth Section - Style Uber */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {loading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Dashboard Button */}
                <Link href={getDashboardLink()}>
                  <Button className="bg-black hover:bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all duration-300 border-2 border-black transform hover:scale-105">
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">📊</span>
                  </Button>
                </Link>

                {/* User Profile & Logout */}
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-black text-sm font-black">
                      {userProfile?.full_name || 'Utilisateur'}
                    </span>
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                      {userProfile?.user_type || 'Membre'}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm sm:text-base border-2 border-black hover:scale-105 transition-transform duration-300 cursor-default">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="text-black hover:text-white hover:bg-black transition-all duration-300 p-2 rounded-lg border-2 border-transparent hover:border-black transform hover:scale-105"
                    title="Se déconnecter"
                  >
                    <span className="text-base sm:text-lg">🚪</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/auth/login">
                  <Button className="bg-black hover:bg-gray-800 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 border-black transition-all duration-300 font-black transform hover:scale-105">
                    <span className="hidden sm:inline">Connexion</span>
                    <span className="sm:hidden">🔑</span>
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-black hover:bg-gray-800 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 border-black transition-all duration-300 font-black transform hover:scale-105">
                    <span className="hidden sm:inline">S&apos;inscrire</span>
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
