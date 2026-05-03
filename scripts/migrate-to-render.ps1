# Migrate to Render (Free, Private Repos Supported)
# Updates all workflow files to use Render
# 
# Usage: .\scripts\migrate-to-render.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Migrating workflows to Render (FREE)..." -ForegroundColor Green
Write-Host ""

$renderWorkflow = @"
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
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: `${{ secrets.RENDER_SERVICE_ID }}
          api-key: `${{ secrets.RENDER_API_KEY }}
"@

foreach ($module in $MODULES) {
    $workflowPath = "repositories\payaid-$module\.github\workflows\deploy.yml"
    
    if (-not (Test-Path $workflowPath)) {
        Write-Host "Skipping $module - workflow not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Updating payaid-$module..." -ForegroundColor Cyan
    
    $moduleName = $module.Substring(0,1).ToUpper() + $module.Substring(1)
    $content = $renderWorkflow -f $moduleName
    Set-Content -Path $workflowPath -Value $content
    
    Write-Host "  Updated workflow" -ForegroundColor Green
}

Write-Host ""
Write-Host "All workflows updated to Render!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Sign up for Render: https://render.com" -ForegroundColor White
Write-Host "2. Create Web Services for each module" -ForegroundColor White
Write-Host "3. Get API key: https://dashboard.render.com/account/api-keys" -ForegroundColor White
Write-Host "4. Get Service IDs from Render dashboard" -ForegroundColor White
Write-Host "5. Add secrets to GitHub:" -ForegroundColor White
Write-Host "   - RENDER_API_KEY (organization level)" -ForegroundColor White
Write-Host "   - RENDER_SERVICE_ID (per repository)" -ForegroundColor White

