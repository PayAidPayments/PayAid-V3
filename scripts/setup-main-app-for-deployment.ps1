# Setup Main Application for Deployment
# Initializes Git and prepares for GitHub/Vercel deployment
# 
# Usage: .\scripts\setup-main-app-for-deployment.ps1

$repoPath = "D:\Cursor Projects\PayAid V3"

Write-Host "Setting up main application for deployment..." -ForegroundColor Green
Write-Host ""

# Check if already a git repository
if (Test-Path "$repoPath\.git") {
    Write-Host "Git already initialized" -ForegroundColor Cyan
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-Host "Uncommitted changes found. Committing..." -ForegroundColor Yellow
        git add .
        git commit -m "Prepare for deployment: Unified platform" 2>&1 | Out-Null
        Write-Host "Changes committed" -ForegroundColor Green
    }
}
else {
    Write-Host "Initializing Git..." -ForegroundColor Cyan
    Push-Location $repoPath
    git init | Out-Null
    git add . | Out-Null
    git commit -m "Initial commit: PayAid V3 unified platform" | Out-Null
    git branch -M main | Out-Null
    Pop-Location
    Write-Host "Git initialized and initial commit created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create GitHub Repository:" -ForegroundColor Cyan
Write-Host "   - Go to: https://github.com/organizations/PayAidPayments/repositories/new" -ForegroundColor White
Write-Host "   - Name: PayAid-V3" -ForegroundColor White
Write-Host "   - Make it PUBLIC" -ForegroundColor White
Write-Host "   - Don't initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "2. Push to GitHub (using GitHub Desktop):" -ForegroundColor Cyan
Write-Host "   - Open GitHub Desktop" -ForegroundColor White
Write-Host "   - File → Add Local Repository" -ForegroundColor White
Write-Host "   - Browse to: D:\Cursor Projects\PayAid V3" -ForegroundColor White
Write-Host "   - Click 'Publish repository'" -ForegroundColor White
Write-Host "   - Owner: PayAidPayments" -ForegroundColor White
Write-Host "   - Name: PayAid-V3" -ForegroundColor White
Write-Host "   - Make PUBLIC" -ForegroundColor White
Write-Host ""
Write-Host "3. Deploy to Vercel:" -ForegroundColor Cyan
Write-Host "   - Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   - Add New Project" -ForegroundColor White
Write-Host "   - Import: PayAidPayments/PayAid-V3" -ForegroundColor White
Write-Host "   - Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "4. Get your single URL and share with team!" -ForegroundColor Green

