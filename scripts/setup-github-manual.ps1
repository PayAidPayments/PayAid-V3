# Manual GitHub Setup Helper
# 
# Helps set up GitHub repositories step by step
# Run this after Git is installed

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName = "PayAidPayments"
)

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "🚀 GitHub Repository Setup Helper" -ForegroundColor Green
Write-Host "Organization: $OrgName" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "   1. Create repositories on GitHub:" -ForegroundColor White
Write-Host "      https://github.com/organizations/$OrgName/repositories/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Create these repositories (one at a time):" -ForegroundColor White
foreach ($module in $MODULES) {
    Write-Host "      - payaid-$module" -ForegroundColor Gray
}
Write-Host ""
Write-Host "   3. After creating repositories, press Enter to continue..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "🔧 Setting up Git repositories..." -ForegroundColor Green

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Skipping $module - directory not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n📦 $module..." -ForegroundColor Cyan
    
    Push-Location $repoPath
    
    # Initialize git
    if (-not (Test-Path ".git")) {
        Write-Host "   Initializing git..." -ForegroundColor Gray
        git init | Out-Null
        git add . | Out-Null
        git commit -m "Initial commit: $($module.Substring(0,1).ToUpper() + $module.Substring(1)) module" | Out-Null
        git branch -M main | Out-Null
        Write-Host "   ✅ Git initialized" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Git already initialized" -ForegroundColor Yellow
    }
    
    # Setup remote
    Write-Host "   Configuring remote..." -ForegroundColor Gray
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$OrgName/$repoName.git"
    Write-Host "   ✅ Remote configured" -ForegroundColor Green
    
    # Show push command
    Write-Host "   📤 To push, run:" -ForegroundColor Yellow
    Write-Host "      git push -u origin main" -ForegroundColor White
    
    Pop-Location
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next: Push each repository to GitHub" -ForegroundColor Yellow
Write-Host "   cd repositories\payaid-<module>" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White

