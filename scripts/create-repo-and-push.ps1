# Script to create GitHub repository and push code
# Requires: GitHub CLI (gh) or manual repository creation

param(
    [string]$OrgName = "PayAidPayments",
    [string]$RepoName = "PayAid-V3",
    [string]$Description = "PayAid V3 - Unified Business Management Platform",
    [switch]$Public = $true
)

Write-Host "🚀 Creating GitHub Repository and Pushing Code" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI found - Creating repository..." -ForegroundColor Green
    
    $visibility = if ($Public) { "public" } else { "private" }
    
    # Create repository
    gh repo create "$OrgName/$RepoName" `
        --$visibility `
        --description $Description `
        --source=. `
        --remote=origin `
        --push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Repository created and code pushed successfully!" -ForegroundColor Green
        Write-Host "📍 Repository URL: https://github.com/$OrgName/$RepoName" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to create repository with GitHub CLI" -ForegroundColor Red
        Write-Host "Please create the repository manually and run:" -ForegroundColor Yellow
        Write-Host "  git remote add origin https://github.com/$OrgName/$RepoName.git" -ForegroundColor Yellow
        Write-Host "  git push -u origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  GitHub CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create the repository manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Owner: $OrgName" -ForegroundColor White
    Write-Host "3. Repository name: $RepoName" -ForegroundColor White
    Write-Host "4. Description: $Description" -ForegroundColor White
    Write-Host "5. Visibility: $(if ($Public) { 'Public' } else { 'Private' })" -ForegroundColor White
    Write-Host "6. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
    Write-Host "7. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run these commands:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/$OrgName/$RepoName.git" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
}

