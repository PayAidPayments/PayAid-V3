# Preserve Landing Page Before Deployment (PowerShell)
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

# 5. Check for landing page dependencies
Write-Host ""
Write-Host "📋 Checking landing page dependencies..." -ForegroundColor Cyan

if (Test-Path "app/page.tsx") {
    Write-Host "Components imported by landing page:"
    $content = Get-Content "app/page.tsx" -Raw
    $componentPattern = 'from .*@/components'
    $componentImports = [regex]::Matches($content, $componentPattern)
    if ($componentImports.Count -gt 0) {
        $componentImports | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Value)" -ForegroundColor Gray }
    } else {
        Write-Host "  (No component imports found)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "API calls in landing page:"
    $apiPattern = "/api/"
    $apiCalls = [regex]::Matches($content, $apiPattern)
    if ($apiCalls.Count -gt 0) {
        $apiCalls | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Value)" -ForegroundColor Gray }
    } else {
        Write-Host "  (No API calls found)" -ForegroundColor Gray
    }
}

# 6. Create restoration script
$restoreLines = @(
    "# Restore Landing Page from Backup (PowerShell)",
    "# Usage: .\restore.ps1",
    "",
    "`$ErrorActionPreference = `"Stop`"",
    "",
    "`$backupDir = Split-Path -Parent `$MyInvocation.MyCommand.Path",
    "",
    "Write-Host `"🔄 Restoring landing page from backup...`" -ForegroundColor Cyan",
    "",
    "if (Test-Path `"`$backupDir/page.tsx`") {",
    "    Copy-Item `"`$backupDir/page.tsx`" `"app/page.tsx`" -Force",
    "    Write-Host `"✅ Restored: app/page.tsx`" -ForegroundColor Green",
    "} else {",
    "    Write-Host `"❌ Error: page.tsx not found in backup`" -ForegroundColor Red",
    "    exit 1",
    "}",
    "",
    "if (Test-Path `"`$backupDir/login/page.tsx`") {",
    "    New-Item -ItemType Directory -Force -Path `"app/login`" | Out-Null",
    "    Copy-Item `"`$backupDir/login/page.tsx`" `"app/login/page.tsx`" -Force",
    "    Write-Host `"✅ Restored: app/login/page.tsx`" -ForegroundColor Green",
    "}",
    "",
    "if (Test-Path `"`$backupDir/signup/page.tsx`") {",
    "    New-Item -ItemType Directory -Force -Path `"app/signup`" | Out-Null",
    "    Copy-Item `"`$backupDir/signup/page.tsx`" `"app/signup/page.tsx`" -Force",
    "    Write-Host `"✅ Restored: app/signup/page.tsx`" -ForegroundColor Green",
    "}",
    "",
    "Write-Host `"`"",
    "Write-Host `"✅ Landing page restored!`" -ForegroundColor Green",
    "Write-Host `"Next steps:`" -ForegroundColor Cyan",
    "Write-Host `"  1. Review changes: git diff app/page.tsx`"",
    "Write-Host `"  2. Commit: git add app/page.tsx; git commit -m `"fix: Restore landing page`"`"",
    "Write-Host `"  3. Push: git push origin main`""
)
$restoreScriptContent = $restoreLines -join "`r`n"

Set-Content -Path "$backupDir/restore.ps1" -Value $restoreScriptContent

# 7. Create verification checklist
$verificationPath = Join-Path $backupDir "VERIFICATION.md"
$lines = @(
    "# Landing Page Verification Checklist",
    "",
    "After deployment, verify:",
    "",
    "- Landing page loads at: https://your-domain.com/",
    "- Hero section displays correctly",
    "- Logo/branding visible",
    "- Sign In button works (links to /login)",
    "- Get Started button works (links to /signup)",
    "- All sections visible (no broken layouts)",
    "- Images/assets load correctly",
    "- No console errors",
    "- Mobile responsive",
    "- Fast load time (< 2 seconds)",
    "",
    "## Quick Test Commands",
    "",
    "### PowerShell",
    "# Check landing page loads",
    "Invoke-WebRequest -Uri `"https://your-domain.com/`" -Method Head",
    "",
    "# Check for key elements",
    "`$response = Invoke-WebRequest -Uri `"https://your-domain.com/`"",
    "`$response.Content | Select-String -Pattern `"Get Started|Sign In|hero`" -CaseSensitive:`$false",
    "",
    "### Bash (if using Git Bash or WSL)",
    "# Check landing page loads",
    "curl -I https://your-domain.com/",
    "",
    "# Check for key elements",
    "curl https://your-domain.com/ | grep -i `"get started\|sign in\|hero`"",
    "",
    "## Restore if Needed",
    "",
    "cd `"$backupDir`"",
    ".\restore.ps1"
)
$lines -join "`r`n" | Set-Content -Path $verificationPath

Write-Host ""
Write-Host "✅ Landing page preservation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files backed up:" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -File | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1024, 2)
    Write-Host "  $($_.Name) ($sizeKB KB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review backup: Get-ChildItem $backupDir -Recurse"
Write-Host "2. Deploy new code: git push origin main"
Write-Host "3. Verify landing page after deployment"
$restorePath = Join-Path $backupDir "restore.ps1"
Write-Host "4. If issues: Run $restorePath"