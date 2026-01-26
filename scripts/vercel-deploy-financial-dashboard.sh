#!/bin/bash
# Vercel Deployment Script for Financial Dashboard Module
# This script helps deploy the Financial Dashboard module to Vercel

set -e

echo "🚀 Financial Dashboard - Vercel Deployment Script"
echo "=================================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI not found. Installing..."
  npm install -g vercel
fi

echo "📋 Step 1: Checking git status..."
git status --short

echo ""
echo "📋 Step 2: Staging changes..."
git add .

echo ""
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
  commit_msg="Financial Dashboard Module - Ready for Vercel deployment"
fi

echo ""
echo "📋 Step 3: Committing changes..."
git commit -m "$commit_msg"

echo ""
read -p "Push to GitHub? (y/n): " push_confirm
if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
  echo ""
  echo "📋 Step 4: Pushing to GitHub..."
  git push
  echo "✅ Pushed to GitHub"
else
  echo "⏭️  Skipping GitHub push"
fi

echo ""
read -p "Deploy to Vercel? (y/n): " deploy_confirm
if [ "$deploy_confirm" = "y" ] || [ "$deploy_confirm" = "Y" ]; then
  echo ""
  echo "📋 Step 5: Deploying to Vercel..."
  vercel --prod
  echo "✅ Deployed to Vercel"
else
  echo "⏭️  Skipping Vercel deployment"
  echo ""
  echo "To deploy manually, run:"
  echo "  vercel --prod"
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Apply database schema: npx prisma migrate deploy (or npx prisma db push)"
echo "2. Run deployment script: npx tsx scripts/deploy-financial-dashboard.ts"
echo "3. Test API endpoints"
echo "4. Verify frontend"
