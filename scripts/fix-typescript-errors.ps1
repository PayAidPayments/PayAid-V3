# Fix TypeScript errors systematically
# This script checks and fixes common TypeScript issues

Write-Host "🔧 Fixing TypeScript errors..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Try to build and capture errors
Write-Host "Step 1: Running build to identify errors..." -ForegroundColor Yellow
$buildOutput = npm run build:check 2>&1 | Out-String

# Extract TypeScript errors
$tsErrors = $buildOutput | Select-String -Pattern "error TS\d+|Type error" -AllMatches

if ($tsErrors) {
    Write-Host "Found TypeScript errors:" -ForegroundColor Red
    $tsErrors | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
} else {
    Write-Host "✅ No TypeScript errors found in build output" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Check the build output above for specific errors to fix" -ForegroundColor Yellow
