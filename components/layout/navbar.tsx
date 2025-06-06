'use client'

import { useState, useEffect } from 'react'
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
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Récupérer le profil à nouveau
        getUser()
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-white">🚀 </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Dev-Client Matcher
              </span>
            </Link>
          </div>

          {/* Navigation principale */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/developers" className="text-slate-300 hover:text-white transition-colors">
              Développeurs
            </Link>
            <Link href="/projects" className="text-slate-300 hover:text-white transition-colors">
              Projets
            </Link>
            
            {user && userProfile && (
              <Link 
                href={userProfile.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer'} 
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-16 h-8 bg-slate-800 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 hidden md:block">
                  Bonjour, <span className="text-cyan-400">{userProfile?.full_name || user.email}</span>
                </span>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                  {userProfile?.user_type === 'client' ? '�� Client' : '💻 Dev'}
                </span>
                <Button 
                  onClick={handleLogout} 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-slate-800"
                >
                  Déconnexion
                </Button>
              </div>
            ) : (
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
