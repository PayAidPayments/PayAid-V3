# Verify route file exists and restart dev server
Write-Host "🔍 Verifying route setup..." -ForegroundColor Cyan
Write-Host ""

# Check if file exists using .NET method (handles square brackets)
$filePath = Join-Path $PWD "app\home\[tenantId]\page.tsx"
$fileExists = [System.IO.File]::Exists($filePath)

if ($fileExists) {
    Write-Host "✅ Route file exists: app\home\[tenantId]\page.tsx" -ForegroundColor Green
    $fileInfo = Get-Item $filePath -Force
    Write-Host "   Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
    Write-Host "   Modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "❌ Route file NOT found!" -ForegroundColor Red
    Write-Host "   Expected: $filePath" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking middleware configuration..." -ForegroundColor Cyan

$middleware = Get-Content "middleware.ts" -Raw
if ($middleware -match "/home/:path\*") {
    Write-Host "✅ Middleware matcher includes /home/:path*" -ForegroundColor Green
} else {
    Write-Host "❌ Middleware matcher missing /home/:path*" -ForegroundColor Red
}

if ($middleware -match "pathname\.startsWith\('/home'\)") {
    Write-Host "✅ Middleware allows /home routes" -ForegroundColor Green
} else {
    Write-Host "❌ Middleware missing /home route handling" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Stopping any existing dev servers..." -ForegroundColor Yellow

# Kill processes on port 3000
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   Stopped process $pid" -ForegroundColor Gray
        } catch {
            # Ignore errors
        }
    }
} else {
    Write-Host "   No process found on port 3000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🗑️  Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "   Cache cleared" -ForegroundColor Gray
} else {
    Write-Host "   No cache to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting dev server..." -ForegroundColor Green
Write-Host "   The route should be available at: http://localhost:3000/home/[tenantId]" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start dev server
npm run dev
