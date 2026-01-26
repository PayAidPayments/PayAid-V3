#!/bin/bash
# Vercel RBAC Setup Helper Script
# This script helps you set up RBAC on Vercel

echo "🚀 PayAid V3 - RBAC Setup for Vercel"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Step 1: Setting Environment Variable"
echo "   Setting ENABLE_RBAC=true for all environments..."
echo ""

# Set environment variable for all environments
vercel env add ENABLE_RBAC production <<< "true" || echo "⚠️  Production env var may already exist"
vercel env add ENABLE_RBAC preview <<< "true" || echo "⚠️  Preview env var may already exist"
vercel env add ENABLE_RBAC development <<< "true" || echo "⚠️  Development env var may already exist"

echo ""
echo "✅ Step 2: Verifying Environment Variables"
vercel env ls | grep ENABLE_RBAC || echo "⚠️  Could not verify. Check Vercel dashboard manually."

echo ""
echo "✅ Step 3: Next Steps"
echo ""
echo "1. The build command in package.json has been updated to include migrations"
echo "2. Environment variable ENABLE_RBAC has been set"
echo "3. Push your changes to trigger a new deployment:"
echo "   git add ."
echo "   git commit -m 'Enable RBAC on Vercel'"
echo "   git push"
echo ""
echo "4. After deployment, initialize roles:"
echo "   npx tsx scripts/initialize-default-roles.ts"
echo "   OR"
echo "   Use the API endpoint: POST /api/admin/initialize-roles"
echo ""
echo "📝 Note: If you prefer to set env vars via Vercel Dashboard:"
echo "   Go to: Vercel Dashboard → Project → Settings → Environment Variables"
echo "   Add: ENABLE_RBAC = true (for all environments)"
echo ""
