#!/bin/bash
echo "🔧 Correction automatique des imports Supabase..."

# Fonction pour corriger un fichier
fix_file() {
    local file="$1"
    echo "📝 Correction de $file"
    
    # Sauvegarder le fichier original
    cp "$file" "$file.bak"
    
    # Corriger l'import incorrect
    sed -i 's/import { supabase } from "..\/..\/lib\/supabase"/import { createClient } from "..\/..\/lib\/supabase"/g' "$file"
    sed -i 's/import { supabase } from "..\/lib\/supabase"/import { createClient } from "..\/lib\/supabase"/g' "$file"
    sed -i 's/import { supabase } from "lib\/supabase"/import { createClient } from "lib\/supabase"/g' "$file"
    sed -i 's/import { supabase } from "@\/lib\/supabase"/import { createClient } from "@\/lib\/supabase"/g' "$file"
    
    # Remplacer les utilisations de supabase par createClient()
    sed -i 's/supabase\./createClient()./g' "$file"
    sed -i 's/await supabase/await createClient()/g' "$file"
    sed -i 's/const.*supabase.*=.*supabase/const supabase = createClient()/g' "$file"
    
    echo "✅ $file corrigé"
}

# Liste des fichiers à corriger
files=(
    "app/dashboard/developer/applications/page.tsx"
    "app/auth/login/page.tsx"
    "app/auth/callback/route.ts"
    "app/projects/page.tsx"
    "components/layout/mobile-navbar.tsx"
    "components/dashboard/developer-applications-content.tsx"
    "components/auth/developer-protected.tsx"
    "components/ContactModal.tsx"
    "components/providers/user-provider.tsx"
    "components/rating/RatingModal.tsx"
)

# Corriger chaque fichier
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        fix_file "$file"
    else
        echo "⚠️  Fichier non trouvé: $file"
    fi
done

echo ""
echo "🔍 Vérification des imports restants..."
echo ""

# Vérifier s'il reste des imports incorrects
remaining=$(grep -r "import.*{.*supabase.*}.*from.*lib/supabase" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -n "$remaining" ]; then
    echo "❌ Imports incorrects trouvés:"
    echo "$remaining"
    echo ""
    echo "🔧 Correction manuelle nécessaire pour ces fichiers"
else
    echo "✅ Tous les imports ont été corrigés!"
fi

echo ""
echo "🚀 Prochaines étapes:"
echo "1. Vérifiez les corrections manuellement"
echo "2. Supprimez le cache: rm -rf .next"
echo "3. Lancez le build: npm run build"
echo "4. Si le build réussit, testez: npm run start"
