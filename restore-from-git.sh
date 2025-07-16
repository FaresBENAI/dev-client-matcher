#!/bin/bash
echo "🔄 Restauration depuis Git..."

files=(
    "app/auth/signup/page.tsx"
    "app/dashboard/client/page.tsx"
    "app/dashboard/client/profile/page.tsx"
    "app/dashboard/client/projects/page.tsx"
    "app/dashboard/developer/profile/page.tsx"
)

for file in "${files[@]}"; do
    git checkout HEAD -- "$file"
    echo "✅ $file restauré depuis Git"
done

echo ""
echo "🚀 Test du build..."
npm run build
