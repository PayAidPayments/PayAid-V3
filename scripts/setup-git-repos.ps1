# Setup Git Repositories and Push to GitHub
# Run this after Git is available and repositories are created
# 
# Usage: .\scripts\setup-git-repos.ps1 -OrgName "PayAidPayments"

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName
)

# Use Classic Token (Full Access) - Note: Use "token" prefix for classic tokens
# Get token from environment variable for security
$GITHUB_TOKEN_CLASSIC = $env:GITHUB_TOKEN_CLASSIC

if (-not $GITHUB_TOKEN_CLASSIC) {
    Write-Host "❌ GITHUB_TOKEN_CLASSIC environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN_CLASSIC = 'your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 Setting up Git repositories..." -ForegroundColor Green
Write-Host "Organization: $OrgName" -ForegroundColor Cyan
Write-Host ""

# Check if Git is available
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "❌ Git is not available. Please restart PowerShell after installing Git." -ForegroundColor Red
    exit 1
}

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")
$results = @()

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Skipping $module - directory not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setting up $module..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $gitInitialized = $false
    $remoteConfigured = $false
    $pushed = $false

    # Initialize Git if needed
    if (-not (Test-Path "$repoPath\.git")) {
        Write-Host "🔧 Initializing git..." -ForegroundColor Green
        Push-Location $repoPath
        git init | Out-Null
        git add . | Out-Null
        git commit -m "Initial commit: $module module" | Out-Null
        git branch -M main | Out-Null
        Pop-Location
        Write-Host "   ✅ Git initialized" -ForegroundColor Green
        $gitInitialized = $true
    } else {
        Write-Host "ℹ️  Git already initialized" -ForegroundColor Cyan
        $gitInitialized = $true
    }

    # Setup remote
    if ($gitInitialized) {
        Write-Host "🔗 Configuring remote..." -ForegroundColor Green
        Push-Location $repoPath
        git remote remove origin 2>$null
        git remote add origin "https://${GITHUB_TOKEN_CLASSIC}@github.com/${OrgName}/${repoName}.git"
        Pop-Location
        Write-Host "   ✅ Remote configured" -ForegroundColor Green
        $remoteConfigured = $true

        # Push to GitHub
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
        Push-Location $repoPath
        
        $pushOutput = git push -u origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Pushed successfully" -ForegroundColor Green
            $pushed = $true
        } else {
            if ($pushOutput -match "refusing to merge unrelated histories") {
                Write-Host "   ⚠️  Merging unrelated histories..." -ForegroundColor Yellow
                git pull origin main --allow-unrelated-histories --no-edit 2>&1 | Out-Null
                git push -u origin main 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Merged and pushed" -ForegroundColor Green
                    $pushed = $true
                }
            } else {
                Write-Host "   ⚠️  Push failed: $pushOutput" -ForegroundColor Yellow
            }
        }
        
        Pop-Location
    }

    $results += [PSCustomObject]@{
        Module = $module
        GitInitialized = $gitInitialized
        RemoteConfigured = $remoteConfigured
        Pushed = $pushed
        Status = if ($pushed) { "Complete" } else { "Incomplete" }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$results | Format-Table -AutoSize

Write-Host "`n📋 Verify repositories: https://github.com/$OrgName" -ForegroundColor Yellow

