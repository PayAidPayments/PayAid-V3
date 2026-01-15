# Clean build script - removes build artifacts and lock files
# Use this if you get lock file errors or want a fresh build

Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Cyan

# Remove Next.js build directory
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

# Remove lock files
if (Test-Path ".next\lock") {
    Remove-Item ".next\lock" -Force
    Write-Host "✅ Removed .next\lock" -ForegroundColor Green
}

# Remove node_modules/.cache if exists
if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Clean complete! You can now run: npm run build:check" -ForegroundColor Cyan
