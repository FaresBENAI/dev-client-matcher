#!/bin/bash
echo "🔧 Correction des appels createClient..."

# Fonction pour corriger les appels createClient avec paramètres
fix_createclient_calls() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Correction de $file"
        
        # Remplacer createClient(params) par const supabase = createClient()
        sed -i '/const supabase = createClient(/,/)/{
            s/const supabase = createClient(/const supabase = createClient()/
            /process\.env\./d
        }' "$file"
        
        echo "✅ $file corrigé"
    fi
}

# Liste des fichiers qui ont encore des erreurs selon le build
files_to_fix=(
    "app/auth/signup/page.tsx"
    "app/dashboard/client/page.tsx"
    "app/dashboard/client/profile/page.tsx"
    "app/dashboard/client/projects/page.tsx"
    "app/dashboard/developer/profile/page.tsx"
    "app/developer-profile/page.tsx"
    "app/developers/page.tsx"
    "app/messages/page.tsx"
    "app/page.tsx"
    "app/projects/[id]/page.tsx"
    "app/projects/page-debug.tsx"
    "app/table-structure/page.tsx"
    "components/auth/client-protected.tsx"
    "components/dashboard/create-project-content.tsx"
    "components/layout/navbar.tsx"
    "components/layout/unified-navbar.tsx"
    "components/messaging/contact-developer-modal.tsx"
    "components/messaging/messages-content.tsx"
)

# Corriger chaque fichier
for file in "${files_to_fix[@]}"; do
    fix_createclient_calls "$file"
done

echo ""
echo "🔧 Correction manuelle pour app/auth/signup/page.tsx..."

# Correction spéciale pour signup qui est plus complexe
if [ -f "app/auth/signup/page.tsx" ]; then
    # Créer une sauvegarde
    cp "app/auth/signup/page.tsx" "app/auth/signup/page.tsx.backup"
    
    # Corriger manuellement
    sed -i '10,13c\
const supabase = createClient()' "app/auth/signup/page.tsx"
    
    echo "✅ app/auth/signup/page.tsx corrigé spécialement"
fi

echo ""
echo "🚀 Test du build..."
npm run build
