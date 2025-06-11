// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

// Configuration pour les API routes côté serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé secrète côté serveur

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper pour récupérer l'utilisateur depuis le token
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error) throw error
    return user
  } catch {
    return null
  }
}
