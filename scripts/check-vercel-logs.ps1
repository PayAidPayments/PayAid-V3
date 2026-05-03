# Check Vercel Deployment Logs (PowerShell)
# 
# This script helps you check Vercel deployment logs for errors
# 
# Usage:
#   .\scripts\check-vercel-logs.ps1 [deployment-url]

param(
    [string]$DeploymentUrl = "payaid-v3.vercel.app"
)

Write-Host "🔍 Vercel Deployment Logs Checker" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel CLI not found"
    }
} catch {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Checking logs for: $DeploymentUrl" -ForegroundColor Cyan
Write-Host ""

# List recent deployments
Write-Host "📦 Recent Deployments:" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Gray
try {
    vercel ls --yes 2>&1 | Select-Object -First 20
} catch {
    Write-Host "   Could not fetch deployments" -ForegroundColor Yellow
}
Write-Host ""

# Get the latest deployment
Write-Host "🔍 Latest Deployment Details:" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Gray
try {
    $deployments = vercel ls --yes 2>&1
    $latestDeployment = $deployments | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1
    
    if ($null -eq $latestDeployment) {
        Write-Host "   No deployments found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 To deploy:" -ForegroundColor Yellow
        Write-Host "   vercel --prod" -ForegroundColor White
        exit 1
    }
    
    Write-Host "   URL: $($latestDeployment.Line)" -ForegroundColor Green
    Write-Host ""
    
    # Check logs for the login endpoint
    Write-Host "🔍 Checking logs for /api/auth/login endpoint:" -ForegroundColor Cyan
    Write-Host "-----------------------------------------------" -ForegroundColor Gray
    try {
        vercel logs $latestDeployment.Line --follow=false 2>&1 | Select-String -Pattern "login|error|fail" -CaseSensitive:$false | Select-Object -Last 20
    } catch {
        Write-Host "   No logs found or error accessing logs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Instructions
Write-Host "📝 Manual Steps to Check Logs:" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Gray
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project: PayAid V3" -ForegroundColor White
Write-Host "3. Click on the latest deployment" -ForegroundColor White
Write-Host "4. Go to the 'Functions' tab" -ForegroundColor White
Write-Host "5. Click on '/api/auth/login' function" -ForegroundColor White
Write-Host "6. Check the 'Logs' section for errors" -ForegroundColor White
Write-Host ""
Write-Host "Or use Vercel CLI:" -ForegroundColor Yellow
Write-Host "   vercel logs <deployment-url> --follow" -ForegroundColor White
Write-Host ""

