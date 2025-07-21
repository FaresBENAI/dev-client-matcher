import { createClient } from '@supabase/supabase-js'

// 🔧 Polyfill pour AbortSignal.timeout (compatibilité navigateurs)
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function(delay: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  };
}

// Variables d'environnement Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 🔍 DEBUG - Log de configuration
console.log('🔧 Configuration Supabase Client:')
console.log('- URL:', supabaseUrl)
console.log('- Anon Key disponible:', !!supabaseAnonKey)
console.log('- Environnement:', process.env.NODE_ENV)

// Configuration Supabase avec debug
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
    },
    // 🔧 Augmenter le timeout pour les réponses lentes
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Timeout de 30 secondes au lieu de 10 par défaut
        signal: AbortSignal.timeout(30000)
      })
    }
  },
  // 🔍 DEBUG - Ajouter des logs pour les requêtes
  ...(process.env.NODE_ENV === 'development' && {
    realtime: {
      logger: console.log
    }
  })
})

// 🔍 DEBUG - Intercepter les erreurs auth
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth State Change:', event, session?.user?.email || 'No user')
  })

  // 🔍 DEBUG - Intercepter les erreurs de requête
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const [url, options] = args
    
    // Log seulement les requêtes Supabase
    if (typeof url === 'string' && url.includes('supabase')) {
      console.log('📡 Requête Supabase:', {
        url,
        method: options?.method || 'GET',
        headers: options?.headers,
        timestamp: new Date().toISOString()
      })
    }

    try {
      const response = await originalFetch(...args)
      
      // Log les erreurs pour les requêtes Supabase
      if (typeof url === 'string' && url.includes('supabase') && !response.ok) {
        console.error('📡 Erreur Requête Supabase:', {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        })
      }
      
      return response
    } catch (error) {
      if (typeof url === 'string' && url.includes('supabase')) {
        console.error('📡 Erreur Réseau Supabase:', {
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
      throw error
    }
  }
}

// Pour la compatibilité avec l'ancien code
function createClientFunction() {
  return supabase
}

export { supabase, createClientFunction as createClient }
export default supabase
