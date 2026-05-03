# Commit and Push Updated Netlify Workflows
# Commits the workflow changes to all repositories
# 
# Usage: .\scripts\commit-netlify-workflows.ps1

$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

Write-Host "Committing Netlify workflow changes..." -ForegroundColor Green
Write-Host ""

foreach ($module in $MODULES) {
    $repoPath = "repositories\payaid-$module"
    $workflowPath = "$repoPath\.github\workflows\deploy.yml"
    
    if (-not (Test-Path $workflowPath)) {
        Write-Host "Skipping $module - workflow not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Committing payaid-$module..." -ForegroundColor Cyan
    
    Push-Location $repoPath
    
    # Check if there are changes
    $status = git status --porcelain
    if ($status -match "deploy.yml") {
        git add .github/workflows/deploy.yml
        git commit -m "chore: Migrate from Vercel to Netlify" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Committed" -ForegroundColor Green
            
            # Check if remote exists
            $hasRemote = git remote get-url origin 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Pushing..." -ForegroundColor Cyan
                git push origin main 2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  Pushed successfully" -ForegroundColor Green
                }
                else {
                    Write-Host "  Push failed (may need manual push)" -ForegroundColor Yellow
                }
            }
            else {
                Write-Host "  No remote configured" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  Commit failed" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  No changes to commit" -ForegroundColor Gray
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up Netlify (see NETLIFY_SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "2. Add GitHub secrets (NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID)" -ForegroundColor White
Write-Host "3. Test deployment by pushing a commit" -ForegroundColor White

