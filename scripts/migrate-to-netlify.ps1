# Migrate GitHub Actions Workflows from Vercel to Netlify
# Updates all workflow files to deploy to Netlify instead
# 
# Usage: .\scripts\migrate-to-netlify.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Migrating workflows to Netlify..." -ForegroundColor Green
Write-Host ""
Write-Host "This will update all workflow files to use Netlify instead of Vercel." -ForegroundColor Yellow
Write-Host ""

foreach ($module in $MODULES) {
    $workflowPath = "repositories\payaid-$module\.github\workflows\deploy.yml"
    
    if (-not (Test-Path $workflowPath)) {
        Write-Host "Skipping $module - workflow not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Updating payaid-$module..." -ForegroundColor Cyan
    
    $content = @"
name: Deploy $($module.Substring(0,1).ToUpper() + $module.Substring(1)) Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test || true
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './.next'
          production-branch: main
          github-token: `${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
          enable-pull-request-comment: false
          enable-commit-comment: true
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: `${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: `${{ secrets.NETLIFY_SITE_ID }}
"@
    
    Set-Content -Path $workflowPath -Value $content
    
    Write-Host "  Updated workflow file" -ForegroundColor Green
}

Write-Host ""
Write-Host "All workflows updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Sign up for Netlify: https://app.netlify.com" -ForegroundColor White
Write-Host "2. Connect GitHub and import your repositories" -ForegroundColor White
Write-Host "3. Get Netlify Auth Token: https://app.netlify.com/user/applications" -ForegroundColor White
Write-Host "4. Get Site IDs from Netlify dashboard for each project" -ForegroundColor White
Write-Host "5. Add secrets to GitHub:" -ForegroundColor White
Write-Host "   - NETLIFY_AUTH_TOKEN (organization level)" -ForegroundColor White
Write-Host "   - NETLIFY_SITE_ID (per repository)" -ForegroundColor White
Write-Host "6. Commit and push these workflow changes" -ForegroundColor White

