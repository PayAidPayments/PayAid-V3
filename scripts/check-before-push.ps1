# Quick check script - Run this before pushing to catch errors early
# Usage: npm run check-before-push
# Or: .\scripts\check-before-push.ps1

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  PayAid V3 - Pre-Push Build Check" -ForegroundColor Cyan
Write-Host "  This runs the SAME build process as Vercel" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found. Run this from the project root." -ForegroundColor Red
    exit 1
}

# Step 1: Type check
Write-Host "Step 1/2: TypeScript type check..." -ForegroundColor Yellow
$typeCheck = npm run type-check:quick 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] TypeScript errors found!" -ForegroundColor Red
    Write-Host $typeCheck
    Write-Host "`n[TIP] Fix these errors first, then run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Type check passed" -ForegroundColor Green
Write-Host ""

# Step 2: Production build
Write-Host "Step 2/2: Production build (this matches Vercel exactly)..." -ForegroundColor Yellow
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Gray
$build = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Build failed! This is what Vercel will see:" -ForegroundColor Red
    Write-Host $build
    Write-Host "`n[TIP] Fix the errors above, then run: npm run build" -ForegroundColor Yellow
    Write-Host "   Once build succeeds, you can safely push." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  [OK] All checks passed!" -ForegroundColor Green
Write-Host "  Your code is ready to push to Vercel" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
exit 0
