# Pre-push hook to check TypeScript errors before pushing
# This runs the SAME build process that Vercel uses to catch errors early
Write-Host "Running pre-push checks (matching Vercel build process)..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Quick type check first (faster feedback)
Write-Host "Step 1: Running TypeScript type check..." -ForegroundColor Yellow
$typeCheckResult = npm run type-check:quick 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] TypeScript errors found in type check!" -ForegroundColor Red
    Write-Host $typeCheckResult
    Write-Host "`n[TIP] Fix these errors before pushing. This prevents Vercel build failures." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Type check passed!" -ForegroundColor Green
Write-Host ""

# Step 2: Run production build (same as Vercel)
# This catches errors that type-check might miss (like missing imports, etc.)
Write-Host "Step 2: Running production build (matching Vercel)..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes but will catch all build errors..." -ForegroundColor Gray

$buildResult = npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Build failed! This is what Vercel will see." -ForegroundColor Red
    Write-Host $buildResult
    Write-Host "`n[TIP] Fix the errors above before pushing. This prevents Vercel deployment failures." -ForegroundColor Yellow
    Write-Host "   Run 'npm run build' locally to test your fixes." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[OK] All checks passed! Safe to push to Vercel." -ForegroundColor Green
Write-Host ""
exit 0
