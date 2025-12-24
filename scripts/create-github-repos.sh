#!/bin/bash

# Create GitHub Repositories
# 
# Creates GitHub repositories for all modules using GitHub CLI
# Requires: gh CLI installed and authenticated
# 
# Usage: ./scripts/create-github-repos.sh [--org <org-name>] [--private]

set -e

ORG_NAME=""
PRIVATE_FLAG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --org)
      ORG_NAME="$2"
      shift 2
      ;;
    --private)
      PRIVATE_FLAG="--private"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$ORG_NAME" ]; then
  echo "❌ Organization name required"
  echo "Usage: ./scripts/create-github-repos.sh --org <org-name> [--private]"
  exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) not installed"
  echo "Install: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub CLI"
  echo "Run: gh auth login"
  exit 1
fi

MODULES=("core" "crm" "finance" "hr" "marketing" "whatsapp" "analytics" "ai-studio" "communication")

echo "🚀 Creating GitHub repositories for organization: $ORG_NAME"
echo ""

for module in "${MODULES[@]}"; do
  repo_name="payaid-${module}"
  repo_path="repositories/${repo_name}"
  
  if [ ! -d "$repo_path" ]; then
    echo "⚠️  Repository directory not found: $repo_path"
    echo "   Skipping..."
    continue
  fi

  echo "📦 Creating repository: $repo_name"
  
  # Create repository on GitHub
  if gh repo create "${ORG_NAME}/${repo_name}" $PRIVATE_FLAG --source="$repo_path" --remote=origin --push; then
    echo "   ✅ Created and pushed: ${ORG_NAME}/${repo_name}"
  else
    echo "   ⚠️  Repository might already exist or error occurred"
  fi
  
  echo ""
done

echo "✅ GitHub repositories created!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify repositories on GitHub"
echo "   2. Set up CI/CD secrets:"
echo "      - VERCEL_TOKEN"
echo "      - VERCEL_ORG_ID"
echo "      - VERCEL_PROJECT_ID"
echo "   3. Configure branch protection rules"
echo "   4. Set up deployment environments"

