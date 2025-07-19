import { createClient } from '@supabase/supabase-js'

// Variables d'environnement Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Configuration Supabase
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
