# Simple GitHub Setup Script
param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName
)

# Use Classic Token (Full Access) for repository creation
# Get token from environment variable for security
$GITHUB_TOKEN = $env:GITHUB_TOKEN

if (-not $GITHUB_TOKEN) {
    Write-Host "❌ GITHUB_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}
$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "🚀 Setting up GitHub repositories for: $OrgName" -ForegroundColor Green
Write-Host ""

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    $repoPath = "repositories\$repoName"
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Skipping $module - directory not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "📦 $module..." -ForegroundColor Cyan
    
    # Create GitHub repo
    $body = @{
        name = $repoName
        description = "$module module"
        private = $false
        auto_init = $false
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "token $GITHUB_TOKEN"
        "Accept" = "application/vnd.github.v3+json"
    }

    $result = Invoke-RestMethod -Uri "https://api.github.com/orgs/$OrgName/repos" -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
    if ($result) {
        Write-Host "   ✅ Created" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Exists or error" -ForegroundColor Yellow
    }

    # Initialize git
    if (-not (Test-Path "$repoPath\.git")) {
        Push-Location $repoPath
        git init | Out-Null
        git add . | Out-Null
        git commit -m "Initial commit" | Out-Null
        git branch -M main | Out-Null
        Pop-Location
    }

    # Setup remote and push
    Push-Location $repoPath
    git remote remove origin 2>$null
    git remote add origin "https://${GITHUB_TOKEN}@github.com/${OrgName}/${repoName}.git"
    git push -u origin main 2>&1 | Out-Null
    Pop-Location
    
    Write-Host "   ✅ Pushed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "✅ Complete! Check: https://github.com/$OrgName" -ForegroundColor Green

