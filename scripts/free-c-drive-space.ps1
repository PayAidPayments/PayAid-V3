# Free C: drive space - run in PowerShell as needed
# Run: .\scripts\free-c-drive-space.ps1

$freed = 0

# 1. This project's Next.js cache (safe - recreated on npm run dev)
$nextPath = Join-Path $PSScriptRoot "..\.next"
if (Test-Path $nextPath) {
    $size = (Get-ChildItem $nextPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Remove-Item $nextPath -Recurse -Force -ErrorAction SilentlyContinue
    $freed += $size
    Write-Host "Removed .next (Next.js cache): $([math]::Round($size/1MB,1)) MB"
}

# 2. npm cache (safe - packages re-download when needed)
$npmCache = npm config get cache 2>$null
if ($npmCache) {
    $before = (Get-ChildItem $npmCache -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    npm cache clean --force 2>$null
    Write-Host "Cleaned npm cache (was ~$([math]::Round($before/1MB,1)) MB)"
}

# 3. Windows Temp (your user)
$temp = [System.IO.Path]::GetTempPath()
Get-ChildItem $temp -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned user Temp folder"

# 4. Yarn cache (if you use yarn)
if (Get-Command yarn -ErrorAction SilentlyContinue) {
    yarn cache clean 2>$null
    Write-Host "Cleaned yarn cache"
}

Write-Host "`nDone. For more space:"
Write-Host "  - Empty Recycle Bin"
Write-Host "  - Settings > System > Storage > Temporary files (Windows)"
Write-Host "  - Delete old Docker images: docker system prune -a (if you use Docker)"
