# Setup Vercel Projects for All Modules
# This script helps create Vercel projects for all PayAid modules
# 
# Usage: .\scripts\setup-vercel-projects.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Setting up Vercel projects for all modules..." -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
$vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCheck) {
    Write-Host "Vercel CLI not installed" -ForegroundColor Yellow
    Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
    npm i -g vercel
}

# Check if logged in
try {
    vercel whoami | Out-Null
    Write-Host "Vercel CLI ready" -ForegroundColor Green
}
catch {
    Write-Host "Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host "Logging in..." -ForegroundColor Cyan
    vercel login
}

Write-Host ""

# Store project IDs
$projectIds = @{}

foreach ($module in $MODULES) {
    $repoPath = "repositories\payaid-$module"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "Skipping $module - directory not found: $repoPath" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setting up: $module" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location $repoPath
    
    # Check if already linked
    $vercelConfig = ".vercel\project.json"
    if (Test-Path $vercelConfig) {
        Write-Host "Project already linked" -ForegroundColor Cyan
        $projectJson = Get-Content $vercelConfig | ConvertFrom-Json
        if ($projectJson.projectId) {
            $projectIds[$module] = $projectJson.projectId
            Write-Host "   Project ID: $($projectJson.projectId)" -ForegroundColor Green
        }
    }
    else {
        Write-Host "Linking to Vercel..." -ForegroundColor Green
        Write-Host ""
        Write-Host "This will create a new Vercel project or link to an existing one." -ForegroundColor Yellow
        Write-Host ""
        
        # Run vercel link interactively (user will need to select org/project)
        vercel link --yes
        
        # Extract project ID
        if (Test-Path $vercelConfig) {
            $projectJson = Get-Content $vercelConfig | ConvertFrom-Json
            if ($projectJson.projectId) {
                $projectIds[$module] = $projectJson.projectId
                Write-Host "   Project ID: $($projectJson.projectId)" -ForegroundColor Green
            }
        }
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project IDs:" -ForegroundColor Yellow
Write-Host ""

foreach ($module in $MODULES) {
    if ($projectIds.ContainsKey($module)) {
        Write-Host "  payaid-$module : $($projectIds[$module])" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add VERCEL_PROJECT_ID secret to each GitHub repository" -ForegroundColor White
Write-Host "2. Use the Project IDs above" -ForegroundColor White
Write-Host "3. Repository: https://github.com/PayAidPayments/payaid-[module]/settings/secrets/actions" -ForegroundColor White

