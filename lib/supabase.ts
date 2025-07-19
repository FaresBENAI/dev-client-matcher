import { createClient } from '@supabase/supabase-js'

// Validation des variables d'environnement avec fallbacks sécurisés
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Vérification plus robuste pour la production
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Côté serveur, on log l'erreur mais on n'interrompt pas
    console.error('Supabase environment variables missing:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
  }
}

// Configuration Supabase avec protection contre les variables manquantes
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
  : null

// Pour la compatibilité avec l'ancien code
function createClientFunction() {
  if (!supabase) {
    throw new Error('Supabase client not initialized - environment variables missing')
  }
  return supabase
}

export { supabase, createClientFunction as createClient }
export default supabase
