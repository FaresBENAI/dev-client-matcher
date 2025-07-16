// lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Instance singleton pour éviter les connexions multiples
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  // Retourner l'instance existante si elle existe
  if (supabaseInstance) return supabaseInstance
  
  // Créer une nouvelle instance avec optimisations
  supabaseInstance = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        // Headers optimisés pour le cache
        headers: {
          'x-client-info': 'linkerai-saas',
        },
      },
      db: {
        // Optimisations de la base de données
        schema: 'public',
      },
      // Réutiliser les connexions
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    }
  )
  
  return supabaseInstance
}

// Version optimisée pour les requêtes avec jointures
export async function fetchWithJoins(
  table: string,
  query: string,
  filters?: { column: string; value: any }[]
) {
  const supabase = createClient()
  let queryBuilder = supabase.from(table).select(query)
  
  // Appliquer les filtres
  if (filters) {
    filters.forEach(filter => {
      queryBuilder = queryBuilder.eq(filter.column, filter.value)
    })
  }
  
  const { data, error } = await queryBuilder
  
  if (error) {
    console.error(`Error fetching ${table}:`, error)
    throw error
  }
  
  return data
}

// Helper pour l'authentification
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Helper pour le profil utilisateur avec cache
const profileCache = new Map()

export async function getUserProfile(userId: string) {
  // Vérifier le cache
  if (profileCache.has(userId)) {
    const cached = profileCache.get(userId)
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data
    }
  }
  
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      client_profiles(*),
      developer_profiles(*)
    `)
    .eq('id', userId)
    .single()
  
  if (!error && data) {
    profileCache.set(userId, {
      data,
      timestamp: Date.now()
    })
  }
  
  return data
}
