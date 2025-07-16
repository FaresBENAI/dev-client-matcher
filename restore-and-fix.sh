#!/bin/bash
echo "🔄 Restauration et correction manuelle..."

# Restaurer les fichiers
restore_files=(
    "app/auth/signup/page.tsx"
    "app/dashboard/client/page.tsx" 
    "app/dashboard/client/profile/page.tsx"
    "app/dashboard/client/projects/page.tsx"
    "app/dashboard/developer/profile/page.tsx"
)

for file in "${restore_files[@]}"; do
    if [ -f "$file.backup" ]; then
        cp "$file.backup" "$file"
        echo "✅ $file restauré depuis .backup"
    elif [ -f "$file.bak" ]; then
        cp "$file.bak" "$file"
        echo "✅ $file restauré depuis .bak"
    fi
done

echo ""
echo "🔧 Application de corrections simples..."

# Correction simple et sûre pour signup
if [ -f "app/auth/signup/page.tsx" ]; then
    # Juste corriger la ligne createClient avec paramètres
    sed -i 's/const supabase = createClient([^)]*)/const supabase = createClient()/g' "app/auth/signup/page.tsx"
    echo "✅ app/auth/signup/page.tsx - appel createClient corrigé"
fi

echo ""
echo "🚀 Test du build..."
npm run build
