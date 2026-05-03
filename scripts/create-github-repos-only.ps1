# Create GitHub Repositories Only (No Git Required)
# This script creates repositories via GitHub API
# Run this first, then use setup-git-repos.ps1 after Git is available

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgName,
    
    [Parameter(Mandatory=$false)]
    [switch]$Private
)

# Try fine-grained token first (has org permissions), fallback to classic
# Get tokens from environment variables for security
$GITHUB_TOKEN_FINE = $env:GITHUB_TOKEN_FINE
$GITHUB_TOKEN_CLASSIC = $env:GITHUB_TOKEN_CLASSIC

if (-not $GITHUB_TOKEN_FINE -and -not $GITHUB_TOKEN_CLASSIC) {
    Write-Host "❌ GITHUB_TOKEN_FINE or GITHUB_TOKEN_CLASSIC environment variable required" -ForegroundColor Red
    Write-Host "Set it with: `$env:GITHUB_TOKEN_FINE = 'your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creating GitHub Repositories" -ForegroundColor Green
Write-Host "Organization: $OrgName" -ForegroundColor Cyan

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

$results = @()

foreach ($module in $MODULES) {
    $repoName = "payaid-$module"
    
    Write-Host "Creating repository: $repoName" -ForegroundColor Cyan
    
    $body = @{
        name = $repoName
        description = $moduleDescriptions[$module]
        private = $Private.IsPresent
        auto_init = $false
    } | ConvertTo-Json

    # Try fine-grained token first, then classic
    $tokenUsed = $null
    $created = $false
    
    # Try fine-grained token
    $headers = @{
        "Authorization" = "Bearer $GITHUB_TOKEN_FINE"
        "Accept" = "application/vnd.github.v3+json"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/orgs/$OrgName/repos" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        $repoUrl = "https://github.com/$OrgName/$repoName"
        Write-Host "   Created: $repoUrl" -ForegroundColor Green
        $results += [PSCustomObject]@{
            Module = $module
            Repository = "$OrgName/$repoName"
            Status = "Created"
            URL = $repoUrl
        }
        $created = $true
        $tokenUsed = "Fine-grained"
    }
    catch {
        $statusCode = $null
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq 422) {
            $repoUrl = "https://github.com/$OrgName/$repoName"
            Write-Host "   Already exists: $repoUrl" -ForegroundColor Yellow
            $results += [PSCustomObject]@{
                Module = $module
                Repository = "$OrgName/$repoName"
                Status = "Exists"
                URL = $repoUrl
            }
            $created = $true
        }
        elseif ($statusCode -eq 500 -or $statusCode -eq 403) {
            # Try classic token as fallback
            Write-Host "   Fine-grained token failed ($statusCode), trying classic token..." -ForegroundColor Yellow
            $headers = @{
                "Authorization" = "token $GITHUB_TOKEN_CLASSIC"
                "Accept" = "application/vnd.github.v3+json"
                "Content-Type" = "application/json"
            }
            try {
                $response = Invoke-RestMethod -Uri "https://api.github.com/orgs/$OrgName/repos" -Method POST -Headers $headers -Body $body -ErrorAction Stop
                $repoUrl = "https://github.com/$OrgName/$repoName"
                Write-Host "   Created with classic token: $repoUrl" -ForegroundColor Green
                $results += [PSCustomObject]@{
                    Module = $module
                    Repository = "$OrgName/$repoName"
                    Status = "Created"
                    URL = $repoUrl
                }
                $created = $true
                $tokenUsed = "Classic"
            }
            catch {
                $statusCode2 = $null
                if ($_.Exception.Response) {
                    $statusCode2 = [int]$_.Exception.Response.StatusCode
                }
                if ($statusCode2 -eq 422) {
                    $repoUrl = "https://github.com/$OrgName/$repoName"
                    Write-Host "   Already exists: $repoUrl" -ForegroundColor Yellow
                    $results += [PSCustomObject]@{
                        Module = $module
                        Repository = "$OrgName/$repoName"
                        Status = "Exists"
                        URL = $repoUrl
                    }
                    $created = $true
                }
                else {
                    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
                    $results += [PSCustomObject]@{
                        Module = $module
                        Repository = "$OrgName/$repoName"
                        Status = "Failed"
                        URL = ""
                    }
                }
            }
        }
        else {
            Write-Host "   Failed: $errorMsg" -ForegroundColor Red
            $results += [PSCustomObject]@{
                Module = $module
                Repository = "$OrgName/$repoName"
                Status = "Failed"
                URL = ""
            }
        }
    }
}

Write-Host ""
Write-Host "Summary" -ForegroundColor Green
Write-Host ""
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
$failedCount = ($results | Where-Object { $_.Status -eq "Failed" }).Count
if ($failedCount -gt 0) {
    Write-Host "   ⚠️  Some repositories failed to create. Options:" -ForegroundColor Yellow
    Write-Host "   1. Create repositories manually at: https://github.com/organizations/$OrgName/repositories/new" -ForegroundColor White
    Write-Host "   2. Or use GitHub CLI: gh repo create $OrgName/payaid-<module> --public" -ForegroundColor White
    Write-Host "   3. Check token permissions in GitHub Settings" -ForegroundColor White
}
Write-Host "   4. Restart PowerShell to make Git available" -ForegroundColor White
Write-Host "   5. Run: .\scripts\setup-git-repos.ps1 -OrgName PayAidPayments" -ForegroundColor White
$orgUrl = "https://github.com/$OrgName"
Write-Host "   6. Verify repositories: $orgUrl" -ForegroundColor White
