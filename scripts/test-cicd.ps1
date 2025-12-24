# Test CI/CD Setup
# Makes a test commit to trigger CI/CD workflow
# 
# Usage: .\scripts\test-cicd.ps1 [module-name]

param(
    [Parameter(Mandatory=$false)]
    [string]$Module = "core"
)

$repoPath = "repositories\payaid-$Module"

if (-not (Test-Path $repoPath)) {
    Write-Host "Repository not found: $repoPath" -ForegroundColor Red
    Write-Host "Available modules: core, crm, finance, hr, marketing, whatsapp, analytics, ai-studio, communication" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing CI/CD for payaid-$Module..." -ForegroundColor Green
Write-Host ""

Push-Location $repoPath

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Git not initialized. Initializing..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Check current branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout -b main 2>$null
    }
}

# Make a test change
$testFile = "CI_CD_TEST.md"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$content = @"
# CI/CD Test

This file was created to test the CI/CD workflow.

Timestamp: $timestamp

This commit should trigger:
1. GitHub Actions workflow
2. Build process
3. Deployment to Vercel

After verification, this file can be deleted.
"@

Set-Content -Path $testFile -Value $content

# Stage and commit
git add $testFile
git commit -m "test: Trigger CI/CD workflow - $timestamp" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Test commit created successfully" -ForegroundColor Green
    Write-Host ""
    
    # Check if we can push (check for remote)
    $hasRemote = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0 -and $hasRemote) {
        Write-Host "Pushing to GitHub..." -ForegroundColor Green
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Push successful!" -ForegroundColor Green
            Write-Host "Check workflow: https://github.com/PayAidPayments/payaid-$Module/actions" -ForegroundColor Cyan
            Write-Host "Check Vercel: https://vercel.com/dashboard" -ForegroundColor Cyan
        }
        else {
            Write-Host "Push failed. Check your git remote configuration." -ForegroundColor Red
            Write-Host "You can push manually: git push origin main" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "No remote configured. To push manually:" -ForegroundColor Yellow
        Write-Host "  git push origin main" -ForegroundColor White
        Write-Host ""
        Write-Host "Then check:" -ForegroundColor Yellow
        Write-Host "  GitHub Actions: https://github.com/PayAidPayments/payaid-$Module/actions" -ForegroundColor White
        Write-Host "  Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
    }
}
else {
    Write-Host "Failed to create commit. Check git status." -ForegroundColor Red
}

Pop-Location

