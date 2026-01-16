# Quick TypeScript error checker
# This script runs TypeScript check on specific directories to avoid timeout

Write-Host "🔍 Checking TypeScript errors in critical files..." -ForegroundColor Cyan
Write-Host ""

$errors = @()

# Check app/home directory
Write-Host "Checking app/home..." -ForegroundColor Yellow
$homeErrors = npx tsc --noEmit --skipLibCheck app/home/**/*.tsx 2>&1
if ($LASTEXITCODE -ne 0) {
    $errors += "app/home: $homeErrors"
    Write-Host "❌ Errors found in app/home" -ForegroundColor Red
} else {
    Write-Host "✅ app/home: No errors" -ForegroundColor Green
}

# Check components directory
Write-Host "Checking components..." -ForegroundColor Yellow
$componentsErrors = npx tsc --noEmit --skipLibCheck components/**/*.tsx 2>&1
if ($LASTEXITCODE -ne 0) {
    $errors += "components: $componentsErrors"
    Write-Host "❌ Errors found in components" -ForegroundColor Red
} else {
    Write-Host "✅ components: No errors" -ForegroundColor Green
}

# Check lib directory
Write-Host "Checking lib..." -ForegroundColor Yellow
$libErrors = npx tsc --noEmit --skipLibCheck lib/**/*.ts 2>&1
if ($LASTEXITCODE -ne 0) {
    $errors += "lib: $libErrors"
    Write-Host "❌ Errors found in lib" -ForegroundColor Red
} else {
    Write-Host "✅ lib: No errors" -ForegroundColor Green
}

Write-Host ""
if ($errors.Count -gt 0) {
    Write-Host "❌ TypeScript errors found:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    exit 1
} else {
    Write-Host "✅ No TypeScript errors found in critical files!" -ForegroundColor Green
    exit 0
}
