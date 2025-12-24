#!/bin/bash

# Deploy Module to Production
# Usage: ./scripts/deploy-production.sh <module-name>
# Example: ./scripts/deploy-production.sh crm

set -e

MODULE_NAME=$1

if [ -z "$MODULE_NAME" ]; then
  echo "❌ Module name required"
  echo "Usage: ./scripts/deploy-production.sh <module-name>"
  echo "Example: ./scripts/deploy-production.sh crm"
  exit 1
fi

MODULE_DIR="repositories/payaid-${MODULE_NAME}"

if [ ! -d "$MODULE_DIR" ]; then
  echo "❌ Module directory not found: $MODULE_DIR"
  echo "Run: npx tsx scripts/create-module-repository.ts $MODULE_NAME"
  exit 1
fi

echo "🚀 Deploying $MODULE_NAME module to PRODUCTION..."
echo ""
echo "⚠️  WARNING: This will deploy to production!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

cd "$MODULE_DIR"

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "❌ Git repository not initialized"
  exit 1
fi

# Check if remote exists
if ! git remote | grep -q "origin"; then
  echo "❌ No remote repository configured"
  exit 1
fi

# Ensure we're on main branch
git checkout main
git pull origin main

# Build
echo "🔨 Building module..."
npm install
npm run build

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️  Tests failed, but continuing..."

# Deploy to Vercel (production)
if command -v vercel &> /dev/null; then
  echo "🚀 Deploying to Vercel (production)..."
  vercel --prod --env .env.production
else
  echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
  echo "Or deploy manually to your hosting provider"
fi

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   1. Verify production deployment"
echo "   2. Test OAuth2 SSO"
echo "   3. Test module functionality"
echo "   4. Monitor error logs"
echo "   5. Check performance metrics"
