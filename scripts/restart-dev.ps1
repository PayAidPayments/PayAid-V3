# PowerShell script to restart Next.js dev server with cache clearing
# Usage: .\scripts\restart-dev.ps1

Write-Host "🔄 Restarting Next.js Dev Server..." -ForegroundColor Cyan

# Check if .next directory exists
if (Test-Path ".next") {
    Write-Host "🗑️  Clearing Next.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cache to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting dev server..." -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the dev server
npm run dev
