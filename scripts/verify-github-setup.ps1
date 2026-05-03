# Verify GitHub Setup
# This script helps verify the organization name and token

param(
    [Parameter(Mandatory=$false)]
    [string]$OrgName = "PayAidPayments"
)

Write-Host "Verifying GitHub Setup" -ForegroundColor Green
Write-Host ""

# Try different token formats
$tokens = @(
    @{ Name = "Classic Token"; Value = $env:GITHUB_TOKEN_CLASSIC; Format = "token" }
    @{ Name = "Fine-grained Token"; Value = $env:GITHUB_TOKEN_FINE; Format = "Bearer" }
)

foreach ($tokenInfo in $tokens) {
    Write-Host "Testing $($tokenInfo.Name)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "$($tokenInfo.Format) $($tokenInfo.Value)"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    try {
        $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -ErrorAction Stop
        Write-Host "   Token valid! User: $($user.login)" -ForegroundColor Green
        
        # Try to get organizations
        try {
            $orgs = Invoke-RestMethod -Uri "https://api.github.com/user/orgs" -Headers $headers -ErrorAction Stop
            Write-Host "   Organizations:" -ForegroundColor Cyan
            foreach ($org in $orgs) {
                Write-Host "     - Login: $($org.login), Display: $($org.name)" -ForegroundColor White
            }
        } catch {
            Write-Host "   Could not fetch organizations: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Try to verify organization
        $orgVariations = @($OrgName, "payaid-payments", "PayAid-Payments", "payaidpayments")
        foreach ($orgVar in $orgVariations) {
            try {
                $org = Invoke-RestMethod -Uri "https://api.github.com/orgs/$orgVar" -Headers $headers -ErrorAction Stop
                Write-Host "   Found organization: $($org.login) (Display: $($org.name))" -ForegroundColor Green
                Write-Host "   Use this login name: $($org.login)" -ForegroundColor Yellow
                break
            } catch {
                # Continue to next variation
            }
        }
        
        Write-Host ""
        break
    }
    catch {
        Write-Host "   Token invalid or error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Note the correct organization login name from above" -ForegroundColor White
Write-Host "2. Update scripts with correct organization login name" -ForegroundColor White
Write-Host "3. Run: .\scripts\create-github-repos-only.ps1 -OrgName <correct-login>" -ForegroundColor White

