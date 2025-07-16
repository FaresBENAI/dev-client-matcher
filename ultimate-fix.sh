#!/bin/bash
echo "🚀 CORRECTION ULTIME SUPABASE - UNE FOIS POUR TOUTES"
echo "====================================================="
# Fonction universelle de correction
fix_all_supabase_imports() {
    echo "🔧 Correction universelle en cours..."
    
    # Trouver TOUS les fichiers TypeScript/TSX
    find app/ components/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | while read -r file; do
        if [ -f "$file" ]; then
            echo "📝 Traitement: $file"
            
            # 1. CORRIGER TOUS LES IMPORTS INCORRECTS
            sed -i \
                -e 's|import { createClient } from "@supabase/auth-helpers-nextjs"|import { createClient } from "@/lib/supabase"|g' \
                -e 's|import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"|import { createClient } from "@/lib/supabase"|g' \
                -e 's|import { supabase } from.*lib/supabase.*"|import { createClient } from "@/lib/supabase"|g' \
                "$file"
            
            # 2. REMPLACER TOUTES LES RÉFÉRENCES INCORRECTES
            sed -i 's/createClientComponentClient/createClient/g' "$file"
            
            # 3. SUPPRIMER LES PROCESS.ENV
            sed -i '/process\.env\.NEXT_PUBLIC_SUPABASE/d' "$file"
            
            # 4. SUPPRIMER LES LIGNES PARASITES
            sed -i '/^\s*)\s*;*\s*$/d' "$file"
        fi
    done
}
fix_all_supabase_imports
# Supprimer le cache et build
rm -rf .next
npm run build
