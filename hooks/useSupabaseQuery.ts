// hooks/useSupabaseQuery.ts
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface UseSupabaseQueryOptions {
  enabled?: boolean
  refetchInterval?: number
}

// Cache simple en mémoire
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TIME = 30000 // 30 secondes

export function useSupabaseQuery<T = any>(
  table: string,
  query: string,
  filters?: Record<string, any>,
  options: UseSupabaseQueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { enabled = true, refetchInterval } = options
  const supabase = createClient()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Créer une clé de cache unique
        const cacheKey = `${table}:${query}:${JSON.stringify(filters || {})}`
        
        // Vérifier le cache
        const cached = queryCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
          setData(cached.data)
          setLoading(false)
          return
        }

        // Construire la requête
        let queryBuilder = supabase.from(table).select(query)
        
        // Appliquer les filtres
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryBuilder = queryBuilder.eq(key, value)
            }
          })
        }

        // Exécuter la requête
        const { data: result, error: queryError } = await queryBuilder

        if (queryError) throw queryError

        // Mettre en cache
        queryCache.set(cacheKey, { data: result, timestamp: Date.now() })

        if (isMounted.current) {
          setData(result as T)
          setError(null)
        }
      } catch (err) {
        console.error(`Error fetching ${table}:`, err)
        if (isMounted.current) {
          setError(err as Error)
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Refetch interval si spécifié
    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [table, query, JSON.stringify(filters), enabled, refetchInterval])

  const refetch = async () => {
    setLoading(true)
    const cacheKey = `${table}:${query}:${JSON.stringify(filters || {})}`
    queryCache.delete(cacheKey)
    
    try {
      let queryBuilder = supabase.from(table).select(query)
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryBuilder = queryBuilder.eq(key, value)
          }
        })
      }

      const { data: result, error: queryError } = await queryBuilder
      
      if (queryError) throw queryError
      
      queryCache.set(cacheKey, { data: result, timestamp: Date.now() })
      setData(result as T)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Hook spécialisé pour les projets
export function useProjects(filters?: Record<string, any>) {
  return useSupabaseQuery(
    'projects',
    `*, 
    client:profiles!projects_client_id_fkey (
      id, full_name,
      client_profiles (company_name)
    ),
    project_applications (
      id, status, developer_id
    )`,
    filters
  )
}

// Hook spécialisé pour les candidatures
export function useApplications(developerId?: string) {
  return useSupabaseQuery(
    'project_applications',
    `*,
    project:projects (
      id, title, budget_min, budget_max, status,
      client:profiles!projects_client_id_fkey (
        full_name,
        client_profiles (company_name)
      )
    )`,
    developerId ? { developer_id: developerId } : undefined
  )
}
