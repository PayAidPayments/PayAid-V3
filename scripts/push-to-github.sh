#!/bin/bash

# Push All Repositories to GitHub
# 
# Pushes all module repositories to GitHub
# Requires: Git remotes configured
# 
# Usage: ./scripts/push-to-github.sh [--force]

set -e

FORCE_FLAG=""

# Parse arguments
if [[ "$1" == "--force" ]]; then
  FORCE_FLAG="--force"
fi

MODULES=("core" "crm" "finance" "hr" "marketing" "whatsapp" "analytics" "ai-studio" "communication")

echo "🚀 Pushing all repositories to GitHub..."
echo ""

for module in "${MODULES[@]}"; do
  repo_path="repositories/payaid-${module}"
  
  if [ ! -d "$repo_path" ]; then
    echo "⚠️  Repository directory not found: $repo_path"
    continue
  fi

  if [ ! -d "$repo_path/.git" ]; then
    echo "⚠️  Git not initialized: $repo_path"
    echo "   Run: npx tsx scripts/setup-git-repositories.ts"
    continue
  fi

  echo "📦 Pushing ${module} module..."

  cd "$repo_path"

  # Check if remote exists
  if ! git remote | grep -q "origin"; then
    echo "   ⚠️  Remote 'origin' not configured"
    echo "   Add remote: git remote add origin https://github.com/your-org/payaid-${module}.git"
    cd ../..
    continue
  fi

  # Ensure on main branch
  git checkout main 2>/dev/null || git checkout -b main

  # Push to GitHub
  if git push $FORCE_FLAG -u origin main; then
    echo "   ✅ Pushed to GitHub"
  else
    echo "   ⚠️  Push failed (might need to pull first or check permissions)"
  fi

  cd ../..
  echo ""
done

echo "✅ Push complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify repositories on GitHub"
echo "   2. Set up CI/CD secrets"
echo "   3. Configure branch protection"
echo "   4. Set up deployment environments"

