'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuthContextType {
  user: any
  userProfile: any
  loading: boolean
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshAuth: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', userId)
        .single()
      
      if (profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Erreur profil:', error)
    }
  }

  const refreshAuth = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Erreur refresh auth:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Chargement initial
    refreshAuth()

    // Listener pour les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth change:', event, session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
