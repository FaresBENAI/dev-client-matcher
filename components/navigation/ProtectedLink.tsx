// components/navigation/ProtectedLink.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  requireAuth?: boolean
}

export default function ProtectedLink({ 
  href, 
  children, 
  className = '', 
  requireAuth = true 
}: ProtectedLinkProps) {
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
        console.error('Error checking auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // Écouter les changements d'authentification
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    console.log('ProtectedLink clicked:', { href, requireAuth, user: !!user })
    
    // Si l'authentification n'est pas requise, naviguer directement
    if (!requireAuth) {
      router.push(href)
      return
    }

    // Si l'utilisateur n'est pas connecté et que l'auth est requise
    if (!user) {
      console.log('Redirecting to login because user is not authenticated')
      router.push(`/auth/login?redirectTo=${encodeURIComponent(href)}`)
      return
    }

    // Utilisateur connecté, navigation normale
    console.log('User authenticated, navigating to:', href)
    router.push(href)
  }

  if (loading) {
    return (
      <span className={className}>
        {children}
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      type="button"
    >
      {children}
    </button>
  )
}
