#!/bin/bash
# fix-performance.sh

echo "🔧 Correction des problèmes de performance LinkerAI..."

# 1. Arrêter le serveur dev
echo "⏹️  Arrêt du serveur de développement..."
pkill -f "next dev" || true

# 2. Nettoyer complètement
echo "🧹 Nettoyage complet..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/@supabase
rm -rf node_modules/.vite

# 3. Identifier les fichiers problématiques
echo "🔍 Recherche des imports Supabase problématiques..."
echo "================================================"

# Lister TOUS les fichiers qui importent depuis @supabase
echo "📋 Fichiers utilisant @supabase:"
grep -r "from '@supabase" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | cut -d: -f1 | sort | uniq

echo ""
echo "📋 Fichiers créant des clients Supabase:"
grep -r "createClient\s*(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v "lib/supabase"

# 4. Vérifier lib/supabase.ts
echo ""
echo "🔍 Contenu actuel de lib/supabase.ts:"
echo "================================================"
cat lib/supabase.ts

# 5. Créer un client Supabase VRAIMENT singleton
echo ""
echo "✨ Création d'un nouveau client Supabase singleton..."
cat > lib/supabase-singleton.ts << 'EOF'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Vérifier que nous sommes dans le navigateur
const isBrowser = typeof window !== 'undefined'

// Créer une seule instance globale
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // Si l'instance existe déjà, la retourner
  if (clientInstance) {
    return clientInstance
  }

  // Sinon, créer une nouvelle instance
  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: isBrowser ? window.localStorage : undefined,
    }
  })

  // Ajouter un log pour debug
  if (isBrowser) {
    console.log('[SUPABASE] Client singleton créé')
  }

  return clientInstance
}

// Export par défaut
export const supabase = createClient()
export default supabase
