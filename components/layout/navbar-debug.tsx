// components/layout/navbar-debug.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function NavbarDebug() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        console.error('Navbar auth error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleProtectedNavigation = (href: string) => {
    console.log('Navigating to:', href, 'User:', !!user)
    
    if (!user) {
      console.log('User not authenticated, redirecting to login')
      router.push(`/auth/login?redirectTo=${encodeURIComponent(href)}`)
    } else {
      console.log('User authenticated, navigating to:', href)
      router.push(href)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="bg-black text-white rounded-lg p-2 text-xl font-bold">
              L
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">LinkerAI</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Accueil
            </Link>
            
            <Link
              href="/projects"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Projets
            </Link>
            
            <Link
              href="/developers"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Développeurs
            </Link>

            {user ? (
              <>
                <button
                  onClick={() => handleProtectedNavigation('/messages')}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Messages
                </button>
                
                <button
                  onClick={() => handleProtectedNavigation('/dashboard/client')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Dashboard
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Se connecter
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="text-xs text-yellow-800">
            Debug: User = {user ? user.email : 'null'} | Loading = {loading.toString()}
          </div>
        </div>
      )}
    </nav>
  )
}
