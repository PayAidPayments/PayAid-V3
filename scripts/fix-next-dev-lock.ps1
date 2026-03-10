# Remove Next.js dev server lock so only one "npm run dev" can run
# Use when you see: "Unable to acquire lock at .next\dev\lock, is another instance of next dev running?"

$lockPath = ".next\dev\lock"
if (Test-Path $lockPath) {
    Remove-Item -Force $lockPath -ErrorAction SilentlyContinue
    Write-Host "Removed $lockPath - you can start one 'npm run dev' now." -ForegroundColor Green
} else {
    Write-Host "No lock file at $lockPath" -ForegroundColor Gray
}
Write-Host "If the error persists, stop all Node processes and run this script again, then: npm run dev" -ForegroundColor Gray
