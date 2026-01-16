# FFmpeg Installation Script for Windows
# Run this script as Administrator

Write-Host "🎬 FFmpeg Installation Script" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges." -ForegroundColor Yellow
    Write-Host "   Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Right-click PowerShell → Run as Administrator" -ForegroundColor Cyan
    exit 1
}

# Configuration
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$downloadPath = "$env:TEMP\ffmpeg.zip"
$installPath = "C:\ffmpeg"
$binPath = "$installPath\bin"

Write-Host "📥 Downloading FFmpeg..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ Download complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Download manually from:" -ForegroundColor Yellow
    Write-Host "   https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "📦 Extracting FFmpeg..." -ForegroundColor Yellow

# Remove old installation if exists
if (Test-Path $installPath) {
    Write-Host "   Removing old installation..." -ForegroundColor Gray
    Remove-Item -Path $installPath -Recurse -Force
}

# Extract
try {
    Expand-Archive -Path $downloadPath -DestinationPath $installPath -Force
    Write-Host "✅ Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Extraction failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Adding to PATH..." -ForegroundColor Yellow

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Check if already in PATH
if ($currentPath -notlike "*$binPath*") {
    $newPath = $currentPath + ";$binPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "✅ Added to PATH" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Already in PATH" -ForegroundColor Cyan
}

# Cleanup
Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ FFmpeg installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please restart your terminal/IDE for PATH changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restarting, verify with:" -ForegroundColor Cyan
Write-Host "   ffmpeg -version" -ForegroundColor White
Write-Host ""

