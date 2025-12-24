# Prepare repositories for GitHub Desktop
# Initializes Git and makes initial commits
# After running this, use GitHub Desktop to publish each repository

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Preparing repositories for GitHub Desktop..." -ForegroundColor Green
Write-Host ""

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "Skipping $module - directory not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Preparing $module..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location $repoPath
    
    # Initialize Git if not already done
    if (-not (Test-Path ".git")) {
        Write-Host "Initializing Git..." -ForegroundColor Green
        git init | Out-Null
        Write-Host "   Git initialized" -ForegroundColor Green
    }
    else {
        Write-Host "Git already initialized" -ForegroundColor Cyan
    }
    
    # Check if there are uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "Adding files..." -ForegroundColor Green
        git add . | Out-Null
        
        Write-Host "Creating initial commit..." -ForegroundColor Green
        git commit -m "Initial commit: $module module" | Out-Null
        
        Write-Host "Setting branch to main..." -ForegroundColor Green
        git branch -M main | Out-Null
        
        Write-Host "   Ready for GitHub Desktop!" -ForegroundColor Green
    }
    else {
        Write-Host "   Already committed, ready for GitHub Desktop!" -ForegroundColor Green
    }
    
    Pop-Location
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open GitHub Desktop" -ForegroundColor White
Write-Host "2. For each repository:" -ForegroundColor White
Write-Host "   - File > Add Local Repository" -ForegroundColor White
Write-Host "   - Browse to: D:\Cursor Projects\PayAid V3\repositories\payaid-[module]" -ForegroundColor White
Write-Host "   - Click 'Publish repository'" -ForegroundColor White
Write-Host "   - Select organization: PayAidPayments" -ForegroundColor White
Write-Host "   - Name: payaid-[module]" -ForegroundColor White
Write-Host "   - Click 'Publish Repository'" -ForegroundColor White

