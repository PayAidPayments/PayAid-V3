# Restore Vercel Workflows (if you choose Vercel Pro)
# Reverts Netlify changes back to Vercel
# 
# Usage: .\scripts\restore-vercel-workflows.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Restoring Vercel workflows..." -ForegroundColor Green
Write-Host ""

$vercelWorkflow = @"
name: Deploy {0} Module

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
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: `${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: `${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: `${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
"@

foreach ($module in $MODULES) {
    $workflowPath = "repositories\payaid-$module\.github\workflows\deploy.yml"
    
    if (-not (Test-Path $workflowPath)) {
        Write-Host "Skipping $module - workflow not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Restoring payaid-$module..." -ForegroundColor Cyan
    
    $moduleName = $module.Substring(0,1).ToUpper() + $module.Substring(1)
    $content = $vercelWorkflow -f $moduleName
    Set-Content -Path $workflowPath -Value $content
    
    Write-Host "  Restored workflow" -ForegroundColor Green
}

Write-Host ""
Write-Host "All workflows restored to Vercel!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upgrade Vercel to Pro: https://vercel.com/account/billing" -ForegroundColor White
Write-Host "2. Commit and push these changes" -ForegroundColor White
Write-Host "3. Deployments will work with private repos" -ForegroundColor White
Write-Host ""
Write-Host "To commit:" -ForegroundColor Cyan
Write-Host "  .\scripts\commit-netlify-workflows.ps1" -ForegroundColor White
Write-Host "  (Script name is same, but it will commit Vercel workflows now)" -ForegroundColor Gray

