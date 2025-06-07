'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DeveloperProtectedProps {
  children: React.ReactNode
}

export default function DeveloperProtected({ children }: DeveloperProtectedProps) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      // Vérifier le type d'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type === 'developer') {
        setAuthorized(true)
      } else {
        // Rediriger les clients vers leur dashboard
        window.location.href = '/dashboard/client'
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Vérification des autorisations...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-purple-500/20 border border-purple-500/50 text-purple-400 px-6 py-4 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p>Cette section est réservée aux développeurs.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
