// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance
  
  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          }
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )
  
  return supabaseInstance
}

// Pour les Server Components
export function createServerClient() {
  const { cookies } = require('next/headers')
  const cookieStore = cookies()
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
}
