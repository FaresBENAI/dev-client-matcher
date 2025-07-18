import { createClient } from '@supabase/supabase-js'

// Validation des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required. Please check your environment variables.')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please check your environment variables.')
}

// Configuration Supabase optimisée pour la production
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'dev-client-matcher'
    }
  }
})

// Pour la compatibilité avec l'ancien code
function createClientFunction() {
  return supabase
}

export { supabase, createClientFunction as createClient }
export default supabase
