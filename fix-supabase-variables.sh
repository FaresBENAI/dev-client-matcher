#!/bin/bash
echo "🔧 Ajout des variables supabase manquantes..."

# Fonction pour ajouter la variable supabase après l'import
add_supabase_var() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Ajout variable supabase dans $file"
        
        # Ajouter 'const supabase = createClient()' après l'import createClient
        sed -i '/import { createClient }/a\
\
const supabase = createClient()' "$file"
        
        echo "✅ $file corrigé"
    fi
}

# Fichiers qui ont besoin de la variable supabase
files_needing_var=(
    "app/auth/login/page.tsx"
    "app/dashboard/developer/applications/page.tsx"
    "app/projects/page.tsx"
    "components/ContactModal.tsx"
    "components/rating/RatingModal.tsx"
)

for file in "${files_needing_var[@]}"; do
    add_supabase_var "$file"
done

echo ""
echo "🚀 Test du build final..."
npm run build
