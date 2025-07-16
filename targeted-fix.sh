#!/bin/bash
echo "�� Correction ciblée et sûre..."

# Seulement corriger l'import problématique spécifique
find app/ components/ -name "*.tsx" -o -name "*.ts" | while read -r file; do
    if [ -f "$file" ] && grep -q "@supabase/auth-helpers-nextjs" "$file"; then
        echo "📝 Correction import dans: $file"
        
        # SEULEMENT corriger l'import problématique
        sed -i 's|from "@supabase/auth-helpers-nextjs"|from "@/lib/supabase"|g' "$file"
        
        # SEULEMENT remplacer createClientComponentClient par createClient
        sed -i 's/createClientComponentClient/createClient/g' "$file"
    fi
done

echo "✅ Corrections ciblées terminées"
rm -rf .next
npm run build
