#!/bin/bash
# Check Vercel Deployment Logs
# 
# This script helps you check Vercel deployment logs for errors
# 
# Usage:
#   ./scripts/check-vercel-logs.sh [deployment-url]

set -e

echo "🔍 Vercel Deployment Logs Checker"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "   Install it with: npm i -g vercel"
    exit 1
fi

# Get the deployment URL from argument or use default
DEPLOYMENT_URL=${1:-"payaid-v3.vercel.app"}

echo "📋 Checking logs for: $DEPLOYMENT_URL"
echo ""

# List recent deployments
echo "📦 Recent Deployments:"
echo "----------------------"
vercel ls --yes 2>/dev/null | head -20 || echo "   Could not fetch deployments"
echo ""

# Get the latest deployment
echo "🔍 Latest Deployment Details:"
echo "-----------------------------"
LATEST_DEPLOYMENT=$(vercel ls --yes 2>/dev/null | grep -E "https://.*\.vercel\.app" | head -1 | awk '{print $NF}')

if [ -z "$LATEST_DEPLOYMENT" ]; then
    echo "   No deployments found"
    echo ""
    echo "💡 To deploy:"
    echo "   vercel --prod"
    exit 1
fi

echo "   URL: $LATEST_DEPLOYMENT"
echo ""

# Check logs for the login endpoint
echo "🔍 Checking logs for /api/auth/login endpoint:"
echo "-----------------------------------------------"
vercel logs "$LATEST_DEPLOYMENT" --follow=false 2>/dev/null | grep -i "login\|error\|fail" | tail -20 || echo "   No logs found or error accessing logs"
echo ""

# Instructions
echo "📝 Manual Steps to Check Logs:"
echo "-------------------------------"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project: PayAid V3"
echo "3. Click on the latest deployment"
echo "4. Go to the 'Functions' tab"
echo "5. Click on '/api/auth/login' function"
echo "6. Check the 'Logs' section for errors"
echo ""
echo "Or use Vercel CLI:"
echo "   vercel logs $LATEST_DEPLOYMENT --follow"
echo ""

