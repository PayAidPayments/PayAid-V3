# Fix GitHub Actions Workflows for All Repositories
# Changes npm ci to npm install (since lock files don't exist)
# 
# Usage: .\scripts\fix-all-workflows.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Fixing GitHub Actions workflows..." -ForegroundColor Green
Write-Host ""

foreach ($module in $MODULES) {
    $workflowPath = "repositories\payaid-$module\.github\workflows\deploy.yml"
    
    if (-not (Test-Path $workflowPath)) {
        Write-Host "Skipping $module - workflow not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Fixing payaid-$module..." -ForegroundColor Cyan
    
    $content = Get-Content $workflowPath -Raw
    
    # Replace npm ci with npm install
    $content = $content -replace 'run: npm ci', 'run: npm install'
    
    # Remove cache from setup-node (not needed without lock file)
    $content = $content -replace "cache: 'npm'`n", ""
    $content = $content -replace "cache: `"npm`"`n", ""
    
    Set-Content -Path $workflowPath -Value $content -NoNewline
    
    Write-Host "  Updated workflow file" -ForegroundColor Green
}

Write-Host ""
Write-Host "All workflows updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push the changes" -ForegroundColor White
Write-Host "2. The workflows will use 'npm install' instead of 'npm ci'" -ForegroundColor White

