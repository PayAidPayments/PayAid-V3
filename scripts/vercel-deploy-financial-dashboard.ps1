# Vercel Deployment Script for Financial Dashboard Module
# PowerShell version for Windows

Write-Host "🚀 Financial Dashboard - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
try {
    $null = git rev-parse --git-dir 2>$null
} catch {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "📋 Step 1: Checking git status..." -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "📋 Step 2: Staging changes..." -ForegroundColor Green
git add .

Write-Host ""
$commitMsg = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Financial Dashboard Module - Ready for Vercel deployment"
}

Write-Host ""
Write-Host "📋 Step 3: Committing changes..." -ForegroundColor Green
git commit -m $commitMsg

Write-Host ""
$pushConfirm = Read-Host "Push to GitHub? (y/n)"
if ($pushConfirm -eq "y" -or $pushConfirm -eq "Y") {
    Write-Host ""
    Write-Host "📋 Step 4: Pushing to GitHub..." -ForegroundColor Green
    git push
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping GitHub push" -ForegroundColor Yellow
}

Write-Host ""
$deployConfirm = Read-Host "Deploy to Vercel? (y/n)"
if ($deployConfirm -eq "y" -or $deployConfirm -eq "Y") {
    Write-Host ""
    Write-Host "📋 Step 5: Deploying to Vercel..." -ForegroundColor Green
    vercel --prod
    Write-Host "✅ Deployed to Vercel" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping Vercel deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy manually, run:" -ForegroundColor Cyan
    Write-Host "  vercel --prod" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Apply database schema: npx prisma migrate deploy (or npx prisma db push)" -ForegroundColor White
Write-Host "2. Run deployment script: npx tsx scripts/deploy-financial-dashboard.ts" -ForegroundColor White
Write-Host "3. Test API endpoints" -ForegroundColor White
Write-Host "4. Verify frontend" -ForegroundColor White
