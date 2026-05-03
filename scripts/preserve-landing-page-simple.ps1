# Preserve Landing Page Before Deployment (PowerShell - Simple Version)
# Backs up landing page and related files before V3 deployment

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".backup/landing-page-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "🛡️  Preserving Landing Page Before Deployment..." -ForegroundColor Cyan
Write-Host "Backup directory: $backupDir" -ForegroundColor Gray

# 1. Backup main landing page
if (Test-Path "app/page.tsx") {
    Copy-Item "app/page.tsx" "$backupDir/page.tsx" -Force
    Write-Host "✅ Backed up: app/page.tsx" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: app/page.tsx not found" -ForegroundColor Yellow
}

# 2. Backup login page if exists
if (Test-Path "app/login/page.tsx") {
    New-Item -ItemType Directory -Force -Path "$backupDir/login" | Out-Null
    Copy-Item "app/login/page.tsx" "$backupDir/login/page.tsx" -Force
    Write-Host "✅ Backed up: app/login/page.tsx" -ForegroundColor Green
}

# 3. Backup signup page if exists
if (Test-Path "app/signup/page.tsx") {
    New-Item -ItemType Directory -Force -Path "$backupDir/signup" | Out-Null
    Copy-Item "app/signup/page.tsx" "$backupDir/signup/page.tsx" -Force
    Write-Host "✅ Backed up: app/signup/page.tsx" -ForegroundColor Green
}

# 4. Backup landing page components
if (Test-Path "components/landing") {
    Copy-Item "components/landing" "$backupDir/components-landing" -Recurse -Force
    Write-Host "✅ Backed up: components/landing" -ForegroundColor Green
}

# 5. Create simple restore script
$restorePath = Join-Path $backupDir "restore.ps1"
$restoreScript = @"
# Restore Landing Page from Backup
`$ErrorActionPreference = "Stop"
`$backupDir = Split-Path -Parent `$MyInvocation.MyCommand.Path

Write-Host "Restoring landing page..." -ForegroundColor Cyan

if (Test-Path "`$backupDir/page.tsx") {
    Copy-Item "`$backupDir/page.tsx" "app/page.tsx" -Force
    Write-Host "Restored: app/page.tsx" -ForegroundColor Green
} else {
    Write-Host "Error: page.tsx not found" -ForegroundColor Red
    exit 1
}
"@
Set-Content -Path $restorePath -Value $restoreScript

Write-Host ""
Write-Host "✅ Landing page preservation complete!" -ForegroundColor Green
Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review backup: Get-ChildItem $backupDir -Recurse"
Write-Host "2. Deploy new code: git push origin main"
Write-Host "3. Verify landing page after deployment"
Write-Host ("4. If issues: Run " + $restorePath)