# Check TypeScript errors in changed files only
Write-Host "Checking TypeScript errors in changed files..." -ForegroundColor Cyan

# Get changed files
$changedFiles = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.(ts|tsx)$' }

if (-not $changedFiles) {
    Write-Host "No TypeScript files changed. Skipping check." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($changedFiles.Count) changed TypeScript file(s)" -ForegroundColor Yellow

# Check each file
$errors = @()
foreach ($file in $changedFiles) {
    Write-Host "Checking: $file" -ForegroundColor Gray
    $result = npx tsc --noEmit --skipLibCheck $file 2>&1
    if ($LASTEXITCODE -ne 0) {
        $errors += $file
        Write-Host "  ❌ Errors found in $file" -ForegroundColor Red
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ TypeScript errors found in $($errors.Count) file(s):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nPlease fix these errors before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All changed files passed type check!" -ForegroundColor Green
exit 0
