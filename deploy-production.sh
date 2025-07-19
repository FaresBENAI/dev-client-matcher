#!/bin/bash

echo "🚀 LinkerAI Production Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check environment variables
echo "📋 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set in environment"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set in environment"
fi

if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SITE_URL not set in environment"
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_APP_URL not set in environment"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Commit changes if any
echo "💾 Committing changes..."
git add .
git commit -m "Production deployment: Updated environment variables and fixed mobile authentication"

# Push to repository
echo "🔄 Pushing to repository..."
git push origin main

echo ""
echo "🎉 Deployment script completed!"
echo ""
echo "📝 Next steps for Netlify:"
echo "1. Go to https://app.netlify.com"
echo "2. Select your linkerai.net site"
echo "3. Go to Site settings > Environment variables"
echo "4. Add the 4 environment variables from NETLIFY_SETUP.md"
echo "5. Trigger a new deployment"
echo ""
echo "🔧 Environment variables needed:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- NEXT_PUBLIC_SITE_URL"
echo "- NEXT_PUBLIC_APP_URL" 