#!/bin/bash

# Setup Vercel Projects for All Modules
# This script helps create Vercel projects for all PayAid modules
# 
# Usage: ./scripts/setup-vercel-projects.sh

set -e

MODULES=("core" "crm" "finance" "hr" "marketing" "whatsapp" "analytics" "ai-studio" "communication")

echo "🚀 Setting up Vercel projects for all modules..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed"
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "Logging in..."
    vercel login
fi

echo "✅ Vercel CLI ready"
echo ""

# Store project IDs
declare -A PROJECT_IDS

for module in "${MODULES[@]}"; do
    repo_path="repositories/payaid-${module}"
    
    if [ ! -d "$repo_path" ]; then
        echo "⚠️  Skipping $module - directory not found: $repo_path"
        continue
    fi
    
    echo "========================================"
    echo "Setting up: $module"
    echo "========================================"
    
    cd "$repo_path"
    
    # Check if already linked
    if [ -f ".vercel/project.json" ]; then
        echo "ℹ️  Project already linked"
        PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$PROJECT_ID" ]; then
            PROJECT_IDS[$module]=$PROJECT_ID
            echo "   Project ID: $PROJECT_ID"
        fi
    else
        echo "📦 Linking to Vercel..."
        echo ""
        echo "When prompted:"
        echo "  - Select your organization/team"
        echo "  - Create new project (or link existing)"
        echo "  - Use default settings"
        echo ""
        
        vercel link
        
        # Extract project ID
        if [ -f ".vercel/project.json" ]; then
            PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$PROJECT_ID" ]; then
                PROJECT_IDS[$module]=$PROJECT_ID
                echo "   ✅ Project ID: $PROJECT_ID"
            fi
        fi
    fi
    
    cd ../..
    echo ""
done

echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "📋 Project IDs:"
echo ""
for module in "${MODULES[@]}"; do
    if [ ! -z "${PROJECT_IDS[$module]}" ]; then
        echo "  payaid-$module: ${PROJECT_IDS[$module]}"
    fi
done
echo ""
echo "📝 Next steps:"
echo "1. Add VERCEL_PROJECT_ID secret to each GitHub repository"
echo "2. Use the Project IDs above"
echo "3. Repository: https://github.com/PayAidPayments/payaid-[module]/settings/secrets/actions"

