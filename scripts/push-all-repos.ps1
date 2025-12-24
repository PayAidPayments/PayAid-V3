# Push All Repositories to GitHub
# Creates repositories and pushes code for all modules
# Usage: .\scripts\push-all-repos.ps1

# Get token from environment variable for security
$GITHUB_TOKEN = $env:GITHUB_TOKEN

if (-not $GITHUB_TOKEN) {
    Write-Host "❌ GITHUB_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}
$ORG_NAME = "PayAidPayments"

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

Write-Host "Setting up GitHub repositories..." -ForegroundColor Green
Write-Host "Organization: $ORG_NAME" -ForegroundColor Cyan
Write-Host ""

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "Skipping $module - directory not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setting up $module..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Step 1: Create GitHub repository
    Write-Host "Creating GitHub repository..." -ForegroundColor Green
    $body = @{
        name = $repoName
        description = $moduleDescriptions[$module]
        private = $false
        auto_init = $false
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "token $GITHUB_TOKEN"
        "Accept" = "application/vnd.github.v3+json"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/orgs/$ORG_NAME/repos" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "   Repository created: $ORG_NAME/$repoName" -ForegroundColor Green
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        if ($statusCode -eq 422) {
            Write-Host "   Repository already exists: $ORG_NAME/$repoName" -ForegroundColor Yellow
        }
        else {
            Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
            continue
        }
    }
    
    # Step 2: Initialize Git
    Write-Host "Initializing Git..." -ForegroundColor Green
    Push-Location $repoPath
    
    if (-not (Test-Path ".git")) {
        git init | Out-Null
        git add . | Out-Null
        git commit -m "Initial commit: $module module" | Out-Null
        git branch -M main | Out-Null
        Write-Host "   Git initialized" -ForegroundColor Green
    }
    else {
        Write-Host "   Git already initialized" -ForegroundColor Cyan
    }
    
    # Step 3: Configure remote
    Write-Host "Configuring remote..." -ForegroundColor Green
    git remote remove origin 2>$null
    git remote add origin "https://${GITHUB_TOKEN}@github.com/${ORG_NAME}/${repoName}.git"
    Write-Host "   Remote configured" -ForegroundColor Green
    
    # Step 4: Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Green
    $pushOutput = git push -u origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Pushed successfully" -ForegroundColor Green
    }
    else {
        if ($pushOutput -match "refusing to merge unrelated histories") {
            Write-Host "   Merging unrelated histories..." -ForegroundColor Yellow
            git pull origin main --allow-unrelated-histories --no-edit 2>&1 | Out-Null
            git push -u origin main 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Merged and pushed" -ForegroundColor Green
            }
        }
        else {
            Write-Host "   Push failed: $pushOutput" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify: https://github.com/$ORG_NAME" -ForegroundColor Yellow
