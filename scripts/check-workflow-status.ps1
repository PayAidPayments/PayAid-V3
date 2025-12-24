# Check GitHub Actions Workflow Status
# 
# Usage: .\scripts\check-workflow-status.ps1 [module-name]

param(
    [Parameter(Mandatory=$false)]
    [string]$Module = "core"
)

$repo = "PayAidPayments/payaid-$Module"
$actionsUrl = "https://github.com/$repo/actions"

Write-Host "Checking workflow status for payaid-$Module..." -ForegroundColor Green
Write-Host ""

# Try to get workflow runs (requires public repo or authentication)
try {
    $headers = @{
        "Accept" = "application/vnd.github.v3+json"
    }
    
    # Try without auth first (works for public repos)
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/actions/runs?per_page=5" -Headers $headers -ErrorAction Stop
    
    if ($response.workflow_runs.Count -gt 0) {
        Write-Host "Recent Workflow Runs:" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($run in $response.workflow_runs) {
            $statusColor = switch ($run.status) {
                "completed" { "Green" }
                "in_progress" { "Yellow" }
                "queued" { "Cyan" }
                default { "White" }
            }
            
            $conclusionColor = switch ($run.conclusion) {
                "success" { "Green" }
                "failure" { "Red" }
                "cancelled" { "Yellow" }
                default { "White" }
            }
            
            $conclusion = if ($run.conclusion) { $run.conclusion } else { "running" }
            $time = [DateTimeOffset]::FromUnixTimeSeconds($run.created_at).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss")
            
            Write-Host "  Workflow: $($run.name)" -ForegroundColor White
            Write-Host "    Status: $($run.status)" -ForegroundColor $statusColor
            Write-Host "    Conclusion: $conclusion" -ForegroundColor $conclusionColor
            Write-Host "    Triggered: $time" -ForegroundColor Gray
            Write-Host "    URL: $($run.html_url)" -ForegroundColor Cyan
            Write-Host ""
        }
    }
    else {
        Write-Host "No workflow runs found." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Could not fetch workflow status via API." -ForegroundColor Yellow
    Write-Host "This might be because:" -ForegroundColor Yellow
    Write-Host "  - Repository is private (requires authentication)" -ForegroundColor White
    Write-Host "  - No workflows have run yet" -ForegroundColor White
    Write-Host ""
}

Write-Host "View workflows manually:" -ForegroundColor Cyan
Write-Host "  $actionsUrl" -ForegroundColor White
Write-Host ""
Write-Host "Or check Vercel dashboard:" -ForegroundColor Cyan
Write-Host "  https://vercel.com/dashboard" -ForegroundColor White

