# Quick Fix for Prisma File Lock Error
# Run this script in PowerShell (as Administrator if needed)

Write-Host "Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

Write-Host "Removing Prisma client directory..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    # Try to remove with retries
    $maxRetries = 5
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction Stop
            Write-Host "Successfully removed Prisma client directory" -ForegroundColor Green
            break
        } catch {
            $retryCount++
            Write-Host "Attempt $retryCount failed, waiting 2 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host "Waiting 5 seconds for file locks to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prisma client generated successfully!" -ForegroundColor Green
    Write-Host "You can now run: npm run db:seed" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Still getting file lock error." -ForegroundColor Red
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Close Cursor/VS Code completely" -ForegroundColor Yellow
    Write-Host "2. Wait 10 seconds" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host "OR restart your computer" -ForegroundColor Yellow
}
