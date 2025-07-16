#!/bin/bash
echo "🔧 Correction finale des imports (seulement 5 fichiers)..."

# Correction sûre des imports uniquement
files_to_fix=(
    "app/auth/login/page.tsx"
    "app/dashboard/developer/applications/page.tsx"
    "app/projects/page.tsx"
    "components/ContactModal.tsx"
    "components/rating/RatingModal.tsx"
)

for file in "${files_to_fix[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Correction import dans $file"
        # Remplacer SEULEMENT l'import
        sed -i 's/import { supabase }/import { createClient }/g' "$file"
        echo "✅ $file corrigé"
    fi
done

echo ""
echo "🚀 Test du build..."
npm run build
