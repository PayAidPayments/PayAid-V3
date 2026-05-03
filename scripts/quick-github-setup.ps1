# Quick GitHub Setup Script (PowerShell)
# 
# Sets up all GitHub repositories using provided token
# 
# Usage: .\scripts\quick-github-setup.ps1 -OrgName "PayAidPayments"

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName,
    
    [Parameter(Mandatory=$false)]
    [switch]$Private
)

# Use Classic Token (Full Access) for repository creation
# Get token from environment variable for security
$GITHUB_TOKEN = $env:GITHUB_TOKEN

if (-not $GITHUB_TOKEN) {
    Write-Host "❌ GITHUB_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}

if (-not $GITHUB_TOKEN) {
    Write-Host "❌ GitHub token not found" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Setting up GitHub repositories..." -ForegroundColor Green
Write-Host "Organization: $OrgName" -ForegroundColor Cyan
Write-Host "Private: $Private" -ForegroundColor Cyan
Write-Host ""

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

$moduleDescriptions = @{
    "core" = "Core platform module - OAuth2 Provider, License Management, App Store"
    "crm" = "Customer Relationship Management module"
    "finance" = "Finance module - Invoicing & Accounting"
    "hr" = "Human Resources & Payroll module"
    "marketing" = "Marketing & Campaigns module"
    "whatsapp" = "WhatsApp Business module"
    "analytics" = "Analytics & Reporting module"
    "ai-studio" = "AI Studio module"
    "communication" = "Communication module"
}

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Repository directory not found: $repoPath" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setting up $module module..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    # Step 1: Create GitHub repository
    Write-Host "📦 Creating GitHub repository..." -ForegroundColor Green
    
    $body = @{
        name = $repoName
        description = $moduleDescriptions[$module]
        private = $Private.IsPresent
        auto_init = $false
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "token $GITHUB_TOKEN"
        "Accept" = "application/vnd.github.v3+json"
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/orgs/$OrgName/repos" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "   ✅ Repository created: $OrgName/$repoName" -ForegroundColor Green
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        if ($statusCode -eq 422) {
            Write-Host "   ℹ️  Repository already exists: $OrgName/$repoName" -ForegroundColor Yellow
        }
        else {
            Write-Host "   ❌ Failed to create repository: $($_.Exception.Message)" -ForegroundColor Red
            continue
        }
    }

    # Step 2: Initialize Git if needed
    if (-not (Test-Path "$repoPath\.git")) {
        Write-Host "🔧 Initializing git repository..." -ForegroundColor Green
        Push-Location $repoPath
        git init
        git add .
        git commit -m "Initial commit: $($module.Substring(0,1).ToUpper() + $module.Substring(1)) module"
        git branch -M main
        Pop-Location
        Write-Host "   ✅ Git initialized" -ForegroundColor Green
    }

    # Step 3: Setup remote
    Write-Host "🔗 Configuring remote..." -ForegroundColor Green
    Push-Location $repoPath
    
    # Remove existing remote if any
    git remote remove origin 2>$null
    
    # Add new remote with token
    git remote add origin "https://${GITHUB_TOKEN}@github.com/${OrgName}/${repoName}.git"
    Write-Host "   ✅ Remote configured" -ForegroundColor Green
    
    Pop-Location

    # Step 4: Push to GitHub
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
    Push-Location $repoPath
    
    $pushResult = git push -u origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Push failed (might need to pull first or repository is empty)" -ForegroundColor Yellow
        Write-Host "   Output: $pushResult" -ForegroundColor Gray
    }
    
    Pop-Location
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Verify repositories: https://github.com/$OrgName" -ForegroundColor White
Write-Host "   2. Set up CI/CD secrets (see: scripts/setup-cicd-secrets.md)" -ForegroundColor White
Write-Host "   3. Configure branch protection rules" -ForegroundColor White
Write-Host "   4. Set up deployment environments" -ForegroundColor White
