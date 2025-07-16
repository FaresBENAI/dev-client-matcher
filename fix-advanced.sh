#!/bin/bash
echo "🚀 Correction AVANCÉE des imports Supabase..."

# Fonction pour corriger un fichier avec toutes les variantes possibles
fix_file_advanced() {
    local file="$1"
    echo "🔧 Correction avancée de $file"
    
    # Créer une sauvegarde
    cp "$file" "$file.backup"
    
    # Remplacer TOUTES les variantes d'import supabase
    sed -i "s/import { supabase } from '../../../../lib\/supabase';/import { createClient } from '..\/..\/..\/..\/lib\/supabase';/g" "$file"
    sed -i "s/import { supabase } from '../../../lib\/supabase'/import { createClient } from '..\/..\/..\/lib\/supabase'/g" "$file"
    sed -i "s/import { supabase } from '../../lib\/supabase';/import { createClient } from '..\/..\/lib\/supabase';/g" "$file"
    sed -i "s/import { supabase } from '@\/lib\/supabase'/import { createClient } from '@\/lib\/supabase'/g" "$file"
    sed -i "s/import { supabase } from '@\/lib\/supabase';/import { createClient } from '@\/lib\/supabase';/g" "$file"
    
    # Remplacer les utilisations dans le code
    sed -i 's/const supabase = supabase/const supabase = createClient()/g' "$file"
    sed -i 's/await supabase\./await createClient()./g' "$file"
    sed -i 's/supabase\./createClient()./g' "$file"
    
    echo "✅ $file corrigé avec méthode avancée"
}

# Liste des fichiers problématiques identifiés
problem_files=(
    "app/dashboard/developer/applications/page.tsx"
    "app/auth/login/page.tsx"
    "app/projects/page.tsx"
    "components/layout/mobile-navbar.tsx"
    "components/dashboard/developer-applications-content.tsx"
    "components/auth/developer-protected.tsx"
    "components/ContactModal.tsx"
    "components/providers/user-provider.tsx"
    "components/rating/RatingModal.tsx"
)

# Appliquer la correction avancée
for file in "${problem_files[@]}"; do
    if [ -f "$file" ]; then
        fix_file_advanced "$file"
    else
        echo "⚠️ Fichier non trouvé: $file"
    fi
done

echo ""
echo "🔍 Vérification finale..."

# Vérification finale
remaining=$(grep -r "import { supabase }" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -n "$remaining" ]; then
    echo "❌ Imports encore incorrects:"
    echo "$remaining"
else
    echo "✅ TOUS LES IMPORTS SONT MAINTENANT CORRECTS!"
fi

echo ""
echo "🧹 Nettoyage et test..."

# Supprimer le cache
rm -rf .next
echo "✅ Cache .next supprimé"

# Test de compilation TypeScript
echo "🔍 Test TypeScript..."
if command -v npx &> /dev/null; then
    npx tsc --noEmit --skipLibCheck 2>/dev/null && echo "✅ TypeScript OK" || echo "⚠️ Erreurs TypeScript détectées"
fi

echo ""
echo "🚀 ÉTAPES SUIVANTES:"
echo "1. npm run build"
echo "2. npm run dev"
echo ""
echo "💡 Si il y a encore des erreurs, vérifiez que lib/supabase.ts exporte bien createClient"
