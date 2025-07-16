'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UserContextType {
  user: any | null
  profile: any | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => {},
})

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: React.ReactNode
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setLoading(true)
      
      // Récupérer l'utilisateur actuel
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(currentUser)

      // Récupérer le profil complet
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          client_profiles(*),
          developer_profiles(*)
        `)
        .eq('id', currentUser.id)
        .single()

      if (!profileError && userProfile) {
        setProfile(userProfile)
      }

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Charger l'utilisateur au démarrage
    refreshUser()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    refreshUser,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}