#!/bin/bash

# Secure GitHub Setup Script
# 
# Sets up GitHub repositories securely using environment variables
# 
# Usage: 
#   export GITHUB_TOKEN="your-token"
#   export GITHUB_ORG="your-org"
#   ./scripts/setup-github-secure.sh

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN environment variable not set"
  echo "Usage: export GITHUB_TOKEN='your-token' && ./scripts/setup-github-secure.sh"
  exit 1
fi

if [ -z "$GITHUB_ORG" ]; then
  echo "❌ GITHUB_ORG environment variable not set"
  echo "Usage: export GITHUB_ORG='your-org' && ./scripts/setup-github-secure.sh"
  exit 1
fi

echo "🚀 Setting up GitHub repositories..."
echo "Organization: $GITHUB_ORG"
echo ""

MODULES=("core" "crm" "finance" "hr" "marketing" "whatsapp" "analytics" "ai-studio" "communication")

for module in "${MODULES[@]}"; do
  repo_name="payaid-${module}"
  repo_path="repositories/${repo_name}"
  
  if [ ! -d "$repo_path" ]; then
    echo "⚠️  Repository directory not found: $repo_path"
    continue
  fi

  echo "📦 Setting up ${module} module..."

  # Create GitHub repository
  echo "   Creating GitHub repository..."
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${repo_name}\",\"private\":false,\"auto_init\":false}" \
    "https://api.github.com/orgs/${GITHUB_ORG}/repos" \
    || echo "   ⚠️  Repository might already exist"

  # Initialize git if needed
  if [ ! -d "$repo_path/.git" ]; then
    echo "   Initializing git..."
    cd "$repo_path"
    git init
    git add .
    git commit -m "Initial commit: ${module^} module"
    git branch -M main
    cd ../..
  fi

  # Setup remote
  echo "   Configuring remote..."
  cd "$repo_path"
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${repo_name}.git"
  cd ../..

  # Push to GitHub
  echo "   Pushing to GitHub..."
  cd "$repo_path"
  git push -u origin main || echo "   ⚠️  Push failed (might need to pull first)"
  cd ../..

  echo "   ✅ ${module} module setup complete"
  echo ""
done

echo "✅ All repositories set up!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify repositories: https://github.com/${GITHUB_ORG}"
echo "   2. Set up CI/CD secrets"
echo "   3. Configure branch protection"

