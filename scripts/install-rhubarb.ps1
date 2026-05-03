# Rhubarb Lip Sync Installation Script for Windows
# Run this script as Administrator (optional, but recommended for PATH setup)

Write-Host "Rhubarb Lip Sync Installation Script" -ForegroundColor Cyan
Write-Host ""

# Configuration
$installPath = "C:\rhubarb"
$exePath = "$installPath\rhubarb.exe"

# Check if already installed
if (Test-Path $exePath) {
    Write-Host "[INFO] Rhubarb already installed at: $exePath" -ForegroundColor Cyan
    Write-Host ""
    
    # Check version
    try {
        $version = & $exePath --version 2>&1
        Write-Host "   Version: $version" -ForegroundColor Green
    } catch {
        Write-Host "   Could not get version" -ForegroundColor Yellow
    }
    
    Write-Host ""
    # Non-interactive mode: skip reinstall prompt if running from script
    if ($env:RHUBARB_FORCE_REINSTALL -ne "true") {
        Write-Host "[INFO] Rhubarb already installed. Set RHUBARB_FORCE_REINSTALL=true to reinstall." -ForegroundColor Cyan
        Write-Host "[OK] Using existing installation" -ForegroundColor Green
        exit 0
    }
    Write-Host "[REINSTALL] Reinstalling Rhubarb..." -ForegroundColor Yellow
}

# Get latest release from GitHub API
Write-Host "[DOWNLOAD] Fetching latest release information..." -ForegroundColor Yellow
try {
    $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/DanielSWolf/rhubarb-lip-sync/releases/latest" -UseBasicParsing
    $latestVersion = $releaseInfo.tag_name
    Write-Host "   Latest version: $latestVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to fetch release info: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual installation:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://github.com/DanielSWolf/rhubarb-lip-sync/releases" -ForegroundColor Cyan
    Write-Host "   2. Download: rhubarb-lip-sync-X.X.X-Windows.zip" -ForegroundColor Cyan
    Write-Host "   3. Extract rhubarb.exe to: $installPath" -ForegroundColor Cyan
    Write-Host "   4. Set environment variable: RHUBARB_PATH=$exePath" -ForegroundColor Cyan
    exit 1
}

# Find Windows release asset
$windowsAsset = $releaseInfo.assets | Where-Object { $_.name -like "*Windows*.zip" -or $_.name -like "*win*.zip" -or $_.name -like "*.exe" } | Select-Object -First 1

if (-not $windowsAsset) {
    # If no Windows-specific asset, try to find any zip file
    $windowsAsset = $releaseInfo.assets | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1
}

if (-not $windowsAsset) {
    Write-Host "[ERROR] No Windows release found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from:" -ForegroundColor Yellow
    Write-Host "   $($releaseInfo.html_url)" -ForegroundColor Cyan
    exit 1
}

$downloadUrl = $windowsAsset.browser_download_url
$downloadPath = "$env:TEMP\rhubarb.zip"

Write-Host ""
Write-Host "[DOWNLOAD] Downloading Rhubarb Lip Sync..." -ForegroundColor Yellow
Write-Host "   From: $downloadUrl" -ForegroundColor Gray
Write-Host "   To: $downloadPath" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "[OK] Download complete" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Download manually from:" -ForegroundColor Yellow
    Write-Host "   $($releaseInfo.html_url)" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "[EXTRACT] Extracting Rhubarb..." -ForegroundColor Yellow

# Create install directory
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
}

# Extract
try {
    # Check if it's a zip file or exe
    if ($downloadPath -like "*.zip") {
        Expand-Archive -Path $downloadPath -DestinationPath $installPath -Force
        
        # Find rhubarb.exe in extracted files
        $extractedExe = Get-ChildItem -Path $installPath -Filter "rhubarb.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        
        if ($extractedExe) {
            # If exe is in a subdirectory, move it to root
            if ($extractedExe.DirectoryName -ne $installPath) {
                Move-Item -Path $extractedExe.FullName -Destination $exePath -Force
                # Clean up subdirectories if empty
                Get-ChildItem -Path $installPath -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "[WARN] rhubarb.exe not found in extracted files" -ForegroundColor Yellow
            Write-Host "   Looking for any .exe file..." -ForegroundColor Gray
            $anyExe = Get-ChildItem -Path $installPath -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($anyExe) {
                Move-Item -Path $anyExe.FullName -Destination $exePath -Force
                Write-Host "[OK] Found and moved executable" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] No executable found" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        # If it's a direct exe download, just rename it
        Move-Item -Path $downloadPath -Destination $exePath -Force
    }
    
    Write-Host "[OK] Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Verify installation
Write-Host ""
Write-Host "[VERIFY] Verifying installation..." -ForegroundColor Yellow
if (Test-Path $exePath) {
    try {
        $version = & $exePath --version 2>&1
        Write-Host "[OK] Rhubarb installed successfully!" -ForegroundColor Green
        Write-Host "   Location: $exePath" -ForegroundColor Cyan
        Write-Host "   Version: $version" -ForegroundColor Cyan
    } catch {
        Write-Host "[WARN] Installation complete but version check failed" -ForegroundColor Yellow
        Write-Host "   Location: $exePath" -ForegroundColor Cyan
    }
} else {
    Write-Host "[ERROR] Installation failed - executable not found" -ForegroundColor Red
    exit 1
}

# Setup PATH or environment variable
Write-Host ""
Write-Host "[SETUP] Setting up environment..." -ForegroundColor Yellow

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    # Add to system PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$installPath*") {
        $newPath = $currentPath + ";$installPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Host "[OK] Added to system PATH" -ForegroundColor Green
        Write-Host "   [NOTE] Restart terminal for PATH changes to take effect" -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] Already in system PATH" -ForegroundColor Cyan
    }
    
    # Also set RHUBARB_PATH for immediate use
    [Environment]::SetEnvironmentVariable("RHUBARB_PATH", $exePath, "Machine")
    Write-Host "[OK] Set RHUBARB_PATH environment variable" -ForegroundColor Green
} else {
    # Set user-level environment variable
    [Environment]::SetEnvironmentVariable("RHUBARB_PATH", $exePath, "User")
    Write-Host "[OK] Set RHUBARB_PATH (user-level)" -ForegroundColor Green
    Write-Host "   [NOTE] Run as Administrator to add to system PATH" -ForegroundColor Yellow
}

# Cleanup
Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[OK] Rhubarb Lip Sync installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your terminal/IDE for PATH changes" -ForegroundColor White
Write-Host "   2. Verify with: rhubarb --version" -ForegroundColor White
Write-Host "   3. Or use: `$env:RHUBARB_PATH --version" -ForegroundColor White
Write-Host ""
Write-Host "For your .env file, add:" -ForegroundColor Cyan
Write-Host "   RHUBARB_PATH=$exePath" -ForegroundColor White
Write-Host ""
