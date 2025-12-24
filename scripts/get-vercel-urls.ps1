# Get All Vercel Deployment URLs
# Collects URLs for all modules from Vercel projects
# 
# Usage: .\scripts\get-vercel-urls.ps1

Write-Host "Collecting Vercel Deployment URLs..." -ForegroundColor Green
Write-Host ""
Write-Host "Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "For each project, find the deployment URL in the 'Domains' section." -ForegroundColor Yellow
Write-Host ""

$modules = @(
    @{Name="Core"; Module="core"; Description="Core platform module - OAuth2 Provider, License Management, App Store"},
    @{Name="CRM"; Module="crm"; Description="Customer Relationship Management module"},
    @{Name="Finance"; Module="finance"; Description="Finance module - Invoicing & Accounting"},
    @{Name="HR"; Module="hr"; Description="Human Resources & Payroll module"},
    @{Name="Marketing"; Module="marketing"; Description="Marketing & Campaigns module"},
    @{Name="WhatsApp"; Module="whatsapp"; Description="WhatsApp Business module"},
    @{Name="Analytics"; Module="analytics"; Description="Analytics & Reporting module"},
    @{Name="AI Studio"; Module="ai-studio"; Description="AI Studio module"},
    @{Name="Communication"; Module="communication"; Description="Communication module"}
)

Write-Host "Module URLs to collect:" -ForegroundColor Cyan
Write-Host ""

foreach ($module in $modules) {
    Write-Host "  $($module.Name) Module:" -ForegroundColor White
    Write-Host "    Project: payaid-$($module.Module)" -ForegroundColor Gray
    Write-Host "    Description: $($module.Description)" -ForegroundColor Gray
    Write-Host "    URL: https://payaid-$($module.Module).vercel.app" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "After collecting URLs, I'll create a team access document." -ForegroundColor Green

