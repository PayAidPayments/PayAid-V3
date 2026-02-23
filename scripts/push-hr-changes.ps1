# Run after closing other Git processes (Cursor Source Control, other terminals, etc.)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/push-hr-changes.ps1

Set-Location $PSScriptRoot\..

# Remove stale lock if present
$lock = ".git\index.lock"
if (Test-Path $lock) {
    Remove-Item -Force $lock -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

git add -A
git reset -- .env.production
git status -s
Write-Host "`nProceed with commit? (commit message below)"
$msg = "HR Phase 2 & 28 Advanced Features: ESS, Tally, Compliance, Analytics, Salary Simulator, Anomalies, Workforce Forecast, Smart Leave, Shifts, Banking, BGV, Predictive, LMS, Skill Gap, Currencies, Variable Pay, Loans, Benefits, Wellness, Audit Logs, Compliance Checklist, Statutory Reports; roadmap updated"
git commit -m $msg
if ($LASTEXITCODE -eq 0) {
    git push origin main
} else {
    Write-Host "Commit failed or nothing to commit. Fix and run again."
}
