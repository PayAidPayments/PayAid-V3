# Complete GitHub Repository Setup Script
# 
# This script creates GitHub repositories and sets them up for all modules
# It can create repositories via API even if Git is not yet available
# 
# Usage: .\scripts\setup-github-repos.ps1 -OrgName "PayAidPayments" [-Private]

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName,
    
    [Parameter(Mandatory=$false)]
    [switch]$Private
)

# Get tokens from environment variables for security
# Use Classic Token (Full Access) for repository creation
$GITHUB_TOKEN_CLASSIC = $env:GITHUB_TOKEN_CLASSIC
# Fine-grained token for specific repository access
$GITHUB_TOKEN_FINE = $env:GITHUB_TOKEN_FINE

if (-not $GITHUB_TOKEN_CLASSIC -and -not $GITHUB_TOKEN_FINE) {
    Write-Host "❌ GITHUB_TOKEN_CLASSIC or GITHUB_TOKEN_FINE environment variable required" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN_CLASSIC = 'your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 GitHub Repository Setup" -ForegroundColor Green
Write-Host "Organization: $OrgName" -ForegroundColor Cyan
Write-Host "Visibility: $(if ($Private) { 'Private' } else { 'Public' })" -ForegroundColor Cyan
Write-Host ""

# Check if Git is available
$gitAvailable = $false
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitAvailable = $true
    Write-Host "✅ Git is available" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git is not available in current session" -ForegroundColor Yellow
    Write-Host "   Repositories will be created, but Git operations will be skipped" -ForegroundColor Yellow
    Write-Host "   Restart PowerShell after Git installation to complete setup" -ForegroundColor Yellow
}
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

$results = @()

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Skipping $module - directory not found: $repoPath" -ForegroundColor Yellow
        $results += [PSCustomObject]@{
            Module = $module
            RepositoryCreated = $false
            GitInitialized = $false
            RemoteConfigured = $false
            Pushed = $false
            Status = "Directory not found"
        }
        continue
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setting up $module module..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $repoCreated = $false
    $gitInitialized = $false
    $remoteConfigured = $false
    $pushed = $false

    # Step 1: Create GitHub repository via API
    Write-Host "📦 Creating GitHub repository..." -ForegroundColor Green
    
    $body = @{
        name = $repoName
        description = $moduleDescriptions[$module]
        private = $Private.IsPresent
        auto_init = $false
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "token $GITHUB_TOKEN_CLASSIC"
        "Accept" = "application/vnd.github.v3+json"
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/orgs/$OrgName/repos" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "   ✅ Repository created: $OrgName/$repoName" -ForegroundColor Green
        Write-Host "   🔗 URL: https://github.com/$OrgName/$repoName" -ForegroundColor Cyan
        $repoCreated = $true
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        if ($statusCode -eq 422) {
            Write-Host "   ℹ️  Repository already exists: $OrgName/$repoName" -ForegroundColor Yellow
            $repoCreated = $true
        }
        else {
            Write-Host "   ❌ Failed to create repository: $($_.Exception.Message)" -ForegroundColor Red
            $results += [PSCustomObject]@{
                Module = $module
                RepositoryCreated = $false
                GitInitialized = $false
                RemoteConfigured = $false
                Pushed = $false
                Status = "Failed to create repository"
            }
            continue
        }
    }

    # Step 2: Initialize Git if available
    if ($gitAvailable) {
        if (-not (Test-Path "$repoPath\.git")) {
            Write-Host "🔧 Initializing git repository..." -ForegroundColor Green
            Push-Location $repoPath
            try {
                git init | Out-Null
                git add . | Out-Null
                git commit -m "Initial commit: $($module.Substring(0,1).ToUpper() + $module.Substring(1)) module" | Out-Null
                git branch -M main | Out-Null
                Write-Host "   ✅ Git initialized" -ForegroundColor Green
                $gitInitialized = $true
            }
            catch {
                Write-Host "   ⚠️  Git initialization failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            Pop-Location
        }
        else {
            Write-Host "ℹ️  Git already initialized" -ForegroundColor Cyan
            $gitInitialized = $true
        }

        # Step 3: Setup remote
        if ($gitInitialized) {
            Write-Host "🔗 Configuring remote..." -ForegroundColor Green
            Push-Location $repoPath
            
            # Remove existing remote if any
            git remote remove origin 2>$null
            
            # Add new remote with token
            git remote add origin "https://${GITHUB_TOKEN_CLASSIC}@github.com/${OrgName}/${repoName}.git"
            Write-Host "   ✅ Remote configured" -ForegroundColor Green
            $remoteConfigured = $true
            
            Pop-Location

            # Step 4: Push to GitHub
            Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
            Push-Location $repoPath
            
            try {
                $pushOutput = git push -u origin main 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green
                    $pushed = $true
                }
                else {
                    # Check if it's because remote has content
                    if ($pushOutput -match "refusing to merge unrelated histories") {
                        Write-Host "   ⚠️  Remote has content, attempting merge..." -ForegroundColor Yellow
                        git pull origin main --allow-unrelated-histories --no-edit 2>&1 | Out-Null
                        git push -u origin main 2>&1 | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "   ✅ Merged and pushed" -ForegroundColor Green
                            $pushed = $true
                        }
                    }
                    else {
                        Write-Host "   ⚠️  Push failed: $pushOutput" -ForegroundColor Yellow
                    }
                }
            }
            catch {
                Write-Host "   ⚠️  Push failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            Pop-Location
        }
    }
    else {
        Write-Host "⏭️  Skipping Git operations (Git not available)" -ForegroundColor Yellow
        Write-Host "   To complete setup after Git is available, run:" -ForegroundColor Yellow
        Write-Host "   cd $repoPath" -ForegroundColor Gray
        Write-Host "   git init" -ForegroundColor Gray
        Write-Host "   git add ." -ForegroundColor Gray
        Write-Host "   git commit -m `"Initial commit: $module module`"" -ForegroundColor Gray
        Write-Host "   git branch -M main" -ForegroundColor Gray
        Write-Host "   git remote add origin https://${GITHUB_TOKEN_CLASSIC}@github.com/${OrgName}/${repoName}.git" -ForegroundColor Gray
        Write-Host "   git push -u origin main" -ForegroundColor Gray
    }

    $results += [PSCustomObject]@{
        Module = $module
        RepositoryCreated = $repoCreated
        GitInitialized = $gitInitialized
        RemoteConfigured = $remoteConfigured
        Pushed = $pushed
        Status = if ($pushed) { "Complete" } elseif ($repoCreated) { "Repository created, Git pending" } else { "Incomplete" }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$results | Format-Table -AutoSize

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
if (-not $gitAvailable) {
    Write-Host "   1. Restart PowerShell to make Git available" -ForegroundColor White
    Write-Host "   2. Run this script again to complete Git setup" -ForegroundColor White
    Write-Host "   OR manually run Git commands for each module (see above)" -ForegroundColor White
}
Write-Host "   3. Verify repositories: https://github.com/$OrgName" -ForegroundColor White
Write-Host "   4. Set up CI/CD secrets if needed" -ForegroundColor White
Write-Host "   5. Configure branch protection rules" -ForegroundColor White

