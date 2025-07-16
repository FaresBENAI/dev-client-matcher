#!/bin/bash
echo "🔧 Correction des erreurs de syntaxe..."

# Fonction pour corriger les erreurs de syntaxe spécifiques
fix_syntax() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Correction syntaxe de $file"
        
        # Restaurer depuis la sauvegarde si elle existe
        if [ -f "$file.backup" ]; then
            cp "$file.backup" "$file"
        fi
        
        # Appliquer la correction simple et sûre
        sed -i 's/const supabase = createClient(.*/const supabase = createClient()/g' "$file"
        
        echo "✅ $file corrigé"
    fi
}

# Corriger les fichiers avec erreurs de syntaxe
files_with_syntax_errors=(
    "app/auth/signup/page.tsx"
    "app/dashboard/client/page.tsx"
    "app/dashboard/client/profile/page.tsx"
    "app/dashboard/client/projects/page.tsx"
    "app/dashboard/developer/profile/page.tsx"
)

for file in "${files_with_syntax_errors[@]}"; do
    fix_syntax "$file"
done

echo ""
echo "🚀 Test du build..."
npm run build
