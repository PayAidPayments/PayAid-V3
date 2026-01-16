# Pre-push hook to check TypeScript errors before pushing
Write-Host "Running pre-push checks..." -ForegroundColor Cyan

# Run type check with increased memory
Write-Host "Running TypeScript type check..." -ForegroundColor Yellow
$typeCheckResult = npm run type-check:quick 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ TypeScript errors found! Please fix them before pushing." -ForegroundColor Red
    Write-Host $typeCheckResult
    exit 1
}

Write-Host "`n✅ Type check passed!" -ForegroundColor Green
exit 0
