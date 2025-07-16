#!/bin/bash
echo "🔧 Correction simple des imports..."

# Fonction pour corriger un fichier spécifique
fix_import() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Correction de $file"
        # Remplacer l'import incorrect par le bon
        sed -i 's/import { supabase }/import { createClient }/g' "$file"
        echo "✅ $file corrigé"
    fi
}

# Corriger les 3 fichiers problématiques identifiés
fix_import "app/auth/login/page.tsx"
fix_import "app/projects/page.tsx" 
fix_import "app/dashboard/developer/applications/page.tsx"

echo ""
echo "🔍 Vérification..."
remaining=$(grep -r "import { supabase }" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -n "$remaining" ]; then
    echo "❌ Imports encore incorrects:"
    echo "$remaining"
else
    echo "✅ Tous les imports sont corrects!"
fi

echo ""
echo "�� Suppression du cache..."
rm -rf .next

echo ""
echo "🚀 Test du build..."
npm run build
