# Fix Prisma Lock Issue
# This script helps unlock Prisma client files

Write-Host "🔧 Fixing Prisma Lock Issue..." -ForegroundColor Cyan
Write-Host ""

# Find Node processes
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}

if ($nodeProcesses) {
    Write-Host "⚠️  Found Node.js processes running:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, Path -AutoSize
    Write-Host ""
    Write-Host "These processes might be locking Prisma files." -ForegroundColor Yellow
    Write-Host ""
    
    $kill = Read-Host "Do you want to kill all Node processes? (y/n)"
    if ($kill -eq 'y' -or $kill -eq 'Y') {
        $nodeProcesses | ForEach-Object {
            Write-Host "Killing process: $($_.ProcessName) (ID: $($_.Id))" -ForegroundColor Red
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host ""
        Write-Host "✅ Node processes killed. Waiting 2 seconds..." -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "✅ No Node.js processes found." -ForegroundColor Green
}

# Try to unlock Prisma files by removing temp files
$prismaPath = "node_modules\.prisma\client"
if (Test-Path $prismaPath) {
    Write-Host ""
    Write-Host "🧹 Cleaning up Prisma temp files..." -ForegroundColor Cyan
    Get-ChildItem -Path $prismaPath -Filter "*.tmp*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing: $($_.FullName)" -ForegroundColor Yellow
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "🔄 Now try running: npx prisma generate" -ForegroundColor Green
Write-Host ""

