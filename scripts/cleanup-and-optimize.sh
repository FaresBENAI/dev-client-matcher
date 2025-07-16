#!/bin/bash
# scripts/cleanup-and-optimize.sh

echo "🧹 Starting LinkerAI cleanup and optimization..."

# 1. Nettoyer les caches
echo "📦 Cleaning caches..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# 2. Réinstaller les dépendances proprement
echo "📥 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# 3. Vérifier les imports Supabase problématiques
echo "🔍 Checking for problematic Supabase imports..."
echo "Files with @supabase/auth-helpers-nextjs imports:"
grep -r "@supabase/auth-helpers-nextjs" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules || echo "✅ No problematic imports found"

# 4. Vérifier les instances multiples de createClient
echo "🔍 Checking for multiple createClient instances..."
echo "Files creating Supabase clients:"
grep -r "createClient(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v "lib/supabase" || echo "✅ No multiple instances found"

# 5. Analyser la taille du bundle
echo "📊 Analyzing bundle size..."
npm run build 2>&1 | grep -E "(First Load JS|chunks|\.js)" || echo "Build analysis complete"

# 6. Vérifier les variables d'environnement
echo "🔐 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Missing NEXT_PUBLIC_SUPABASE_URL"
else
    echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
fi

echo "✅ Cleanup and optimization complete!"
