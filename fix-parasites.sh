#!/bin/bash
echo "🔧 Suppression des caractères parasites..."

# Fonction pour nettoyer les caractères parasites
clean_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Nettoyage de $file"
        
        # Supprimer les lignes avec juste ')' ou ')' ou ');' après createClient()
        sed -i '/^const supabase = createClient()$/,/^[[:space:]]*)[[:space:]]*;*[[:space:]]*$/{ 
            /^[[:space:]]*)[[:space:]]*;*[[:space:]]*$/d
        }' "$file"
        
        # Supprimer les lignes orphelines avec juste ')' ou '):'
        sed -i '/^[[:space:]]*)[[:space:]]*;*[[:space:]]*$/d' "$file"
        
        echo "✅ $file nettoyé"
    fi
}

# Nettoyer tous les fichiers problématiques
problem_files=(
    "app/auth/signup/page.tsx"
    "app/dashboard/client/page.tsx"
    "app/dashboard/client/profile/page.tsx"
    "app/dashboard/client/projects/page.tsx"
    "app/dashboard/developer/profile/page.tsx"
)

for file in "${problem_files[@]}"; do
    clean_file "$file"
done

echo ""
echo "🚀 Test du build..."
npm run build
