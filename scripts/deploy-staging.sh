#!/bin/bash

# Deploy Module to Staging
# Usage: ./scripts/deploy-staging.sh <module-name>
# Example: ./scripts/deploy-staging.sh crm

set -e

MODULE_NAME=$1

if [ -z "$MODULE_NAME" ]; then
  echo "❌ Module name required"
  echo "Usage: ./scripts/deploy-staging.sh <module-name>"
  echo "Example: ./scripts/deploy-staging.sh crm"
  exit 1
fi

MODULE_DIR="repositories/payaid-${MODULE_NAME}"

if [ ! -d "$MODULE_DIR" ]; then
  echo "❌ Module directory not found: $MODULE_DIR"
  echo "Run: npx tsx scripts/create-module-repository.ts $MODULE_NAME"
  exit 1
fi

echo "🚀 Deploying $MODULE_NAME module to staging..."
echo ""

cd "$MODULE_DIR"

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git add .
  git commit -m "Initial commit: $MODULE_NAME module"
fi

# Check if remote exists
if ! git remote | grep -q "origin"; then
  echo "⚠️  No remote repository configured"
  echo "Please add remote:"
  echo "  git remote add origin https://github.com/your-org/payaid-${MODULE_NAME}.git"
  exit 1
fi

# Build
echo "🔨 Building module..."
npm install
npm run build

# Deploy to Vercel (staging)
if command -v vercel &> /dev/null; then
  echo "🚀 Deploying to Vercel (staging)..."
  vercel --env .env.staging
else
  echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
  echo "Or deploy manually to your hosting provider"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify staging deployment"
echo "   2. Test OAuth2 SSO"
echo "   3. Test module functionality"
echo "   4. Deploy to production when ready"
