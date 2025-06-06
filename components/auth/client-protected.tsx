'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ClientProtectedProps {
  children: React.ReactNode
}

export default function ClientProtected({ children }: ClientProtectedProps) {
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

      if (profile?.user_type === 'client') {
        setAuthorized(true)
      } else {
        // Rediriger les développeurs vers leur dashboard
        window.location.href = '/dashboard/developer'
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
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p>Cette section est réservée aux clients.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
