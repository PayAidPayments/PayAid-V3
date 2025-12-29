# Comprehensive Environment Variables & Vercel Logs Verification Script
# 
# This script verifies environment variables (local and Vercel) and checks Vercel deployment logs
# 
# Usage:
#   .\scripts\verify-env-and-logs.ps1 [options]
# 
# Options:
#   -ProjectName <name>     Vercel project name (default: payaid-v3)
#   -CheckVercelEnv         Attempt to check Vercel environment variables via CLI
#   -FollowLogs             Follow logs in real-time (default: false)
#   -LogLines <number>      Number of log lines to show (default: 50)

param(
    [string]$ProjectName = "payaid-v3",
    [switch]$CheckVercelEnv = $false,
    [switch]$FollowLogs = $false,
    [int]$LogLines = 50
)

$ErrorActionPreference = "Continue"

# Color functions
function Write-SectionHeader {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

function Write-SubSection {
    param([string]$Text)
    Write-Host "`n$Text" -ForegroundColor Yellow
    Write-Host ("-" * $Text.Length) -ForegroundColor Gray
}

# Required environment variables from env.example
$REQUIRED_VARS = @{
    Critical = @(
        'DATABASE_URL',
        'JWT_SECRET',
        'JWT_EXPIRES_IN'
    )
    Important = @(
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'NODE_ENV',
        'APP_URL',
        'NEXT_PUBLIC_APP_URL'
    )
    Optional = @(
        'ENCRYPTION_KEY',
        'REDIS_URL',
        'GROQ_API_KEY',
        'HUGGINGFACE_API_KEY',
        'GEMINI_API_KEY',
        'SENDGRID_API_KEY',
        'PAYAID_ADMIN_API_KEY',
        'PAYAID_ADMIN_SALT',
        'PAYAID_PAYMENTS_PG_API_URL',
        'PAYAID_PAYMENTS_BASE_URL'
    )
}

# Check if Vercel CLI is installed
function Test-VercelCLI {
    try {
        $null = vercel --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            return $false
        }
        return $true
    } catch {
        return $false
    }
}

# Load .env file
function Load-EnvFile {
    $envPath = Join-Path $PSScriptRoot "..\.env"
    $envVars = @{}
    
    if (Test-Path $envPath) {
        Write-Host "📄 Loading .env file from: $envPath" -ForegroundColor Gray
        $content = Get-Content $envPath -Raw
        $lines = $content -split "`n"
        
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed -and !$trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
                $parts = $trimmed -split "=", 2
                if ($parts.Length -eq 2) {
                    $key = $parts[0].Trim()
                    $value = $parts[1].Trim() -replace '^["'']|["'']$', ''
                    $envVars[$key] = $value
                }
            }
        }
    } else {
        Write-Host "⚠️  .env file not found at: $envPath" -ForegroundColor Yellow
    }
    
    return $envVars
}

# Check environment variable
function Test-EnvVariable {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Category
    )
    
    $result = @{
        Name = $Name
        IsSet = $false
        Value = $null
        Category = $Category
        Issues = @()
    }
    
    if ($Value) {
        $result.IsSet = $true
        $result.Value = $Value
        
        # Validate specific variables
        switch ($Name) {
            'DATABASE_URL' {
                if ($Value -match 'localhost|127\.0\.0\.1') {
                    $result.Issues += "⚠️  WARNING - Using localhost (will not work on Vercel)"
                }
                if (!$Value.StartsWith('postgresql://')) {
                    $result.Issues += "⚠️  WARNING - Should start with postgresql://"
                }
                if ($Value -notmatch '\?schema=public') {
                    $result.Issues += "⚠️  WARNING - Should include ?schema=public"
                }
            }
            'JWT_SECRET' {
                if ($Value -eq 'your-secret-key-change-in-production' -or $Value.Length -lt 32) {
                    $result.Issues += "❌ INSECURE - Must be a strong random secret (64+ characters recommended)"
                }
            }
            'NEXTAUTH_SECRET' {
                if ($Value -eq 'your-nextauth-secret-change-in-production' -or $Value.Length -lt 32) {
                    $result.Issues += "❌ INSECURE - Must be a strong random secret (64+ characters recommended)"
                }
            }
            'NEXTAUTH_URL' {
                if ($Value -match 'localhost' -and $env:NODE_ENV -eq 'production') {
                    $result.Issues += "⚠️  WARNING - Using localhost in production"
                }
                if ($Value -notmatch '^https?://') {
                    $result.Issues += "⚠️  WARNING - Should be a valid URL"
                }
            }
            'APP_URL' {
                if ($Value -match 'localhost' -and $env:NODE_ENV -eq 'production') {
                    $result.Issues += "⚠️  WARNING - Using localhost in production"
                }
            }
            'NODE_ENV' {
                if ($Value -notin @('production', 'development', 'test')) {
                    $result.Issues += "⚠️  WARNING - Should be production, development, or test"
                }
            }
        }
        
        # Mask sensitive values
        if ($Name -match 'SECRET|KEY|PASSWORD|SALT|TOKEN') {
            if ($Value.Length -gt 12) {
                $result.Value = $Value.Substring(0, 8) + "..." + $Value.Substring($Value.Length - 4)
            } else {
                $result.Value = "***"
            }
        }
    } else {
        switch ($Category) {
            'Critical' { $result.Issues += "❌ MISSING - Application will not work without this" }
            'Important' { $result.Issues += "⚠️  MISSING - Core features may not work" }
            'Optional' { $result.Issues += "ℹ️  MISSING - Optional feature" }
        }
    }
    
    return $result
}

# Verify local environment variables
function Verify-LocalEnv {
    Write-SectionHeader "🔍 LOCAL ENVIRONMENT VARIABLES VERIFICATION"
    
    $envVars = Load-EnvFile
    $results = @()
    
    # Check all required variables
    foreach ($category in @('Critical', 'Important', 'Optional')) {
        foreach ($varName in $REQUIRED_VARS[$category]) {
            $value = if ($envVars.ContainsKey($varName)) { $envVars[$varName] } else { $env:($varName) }
            $results += Test-EnvVariable -Name $varName -Value $value -Category $category
        }
    }
    
    # Display results
    foreach ($category in @('Critical', 'Important', 'Optional')) {
        $categoryResults = $results | Where-Object { $_.Category -eq $category }
        
        $color = switch ($category) {
            'Critical' { 'Red' }
            'Important' { 'Yellow' }
            'Optional' { 'Green' }
        }
        
        $icon = switch ($category) {
            'Critical' { '🔴' }
            'Important' { '🟡' }
            'Optional' { '🟢' }
        }
        
        Write-Host "$icon $category VARIABLES:" -ForegroundColor $color
        Write-Host ""
        
        foreach ($result in $categoryResults) {
            $status = if ($result.IsSet) { "✅" } else { "❌" }
            $displayValue = if ($result.IsSet) { $result.Value } else { "NOT SET" }
            
            Write-Host "  $status $($result.Name.PadRight(30)) $displayValue" -ForegroundColor $(if ($result.IsSet) { "Green" } else { "Red" })
            
            foreach ($issue in $result.Issues) {
                Write-Host "     $issue" -ForegroundColor $(if ($issue.StartsWith("❌")) { "Red" } else { "Yellow" })
            }
        }
        
        Write-Host ""
    }
    
    # Summary
    Write-SubSection "📊 SUMMARY"
    $criticalSet = ($results | Where-Object { $_.Category -eq 'Critical' -and $_.IsSet }).Count
    $criticalTotal = $REQUIRED_VARS.Critical.Count
    $importantSet = ($results | Where-Object { $_.Category -eq 'Important' -and $_.IsSet }).Count
    $importantTotal = $REQUIRED_VARS.Important.Count
    $optionalSet = ($results | Where-Object { $_.Category -eq 'Optional' -and $_.IsSet }).Count
    $optionalTotal = $REQUIRED_VARS.Optional.Count
    $criticalIssues = ($results | Where-Object { $_.Category -eq 'Critical' -and $_.Issues.Count -gt 0 }).Count
    
    Write-Host "  Critical Variables:   $criticalSet/$criticalTotal set" -ForegroundColor $(if ($criticalSet -eq $criticalTotal) { "Green" } else { "Red" })
    Write-Host "  Important Variables:   $importantSet/$importantTotal set" -ForegroundColor $(if ($importantSet -eq $importantTotal) { "Green" } else { "Yellow" })
    Write-Host "  Optional Variables:    $optionalSet/$optionalTotal set" -ForegroundColor "Gray"
    Write-Host "  Critical Issues:      $criticalIssues found" -ForegroundColor $(if ($criticalIssues -eq 0) { "Green" } else { "Red" })
    Write-Host ""
    
    return @{
        CriticalSet = $criticalSet
        CriticalTotal = $criticalTotal
        CriticalIssues = $criticalIssues
        Results = $results
    }
}

# Check Vercel environment variables
function Verify-VercelEnv {
    if (!$CheckVercelEnv) {
        Write-Host "💡 Tip: Use -CheckVercelEnv to check Vercel environment variables via CLI" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-SectionHeader "🔍 VERCEL ENVIRONMENT VARIABLES VERIFICATION"
    
    if (!(Test-VercelCLI)) {
        Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
        Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Write-Host "📋 Checking Vercel environment variables for project: $ProjectName" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # List environment variables
        $envList = vercel env ls $ProjectName --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Environment Variables:" -ForegroundColor Green
            $envList | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "⚠️  Could not fetch environment variables. Make sure you're logged in:" -ForegroundColor Yellow
            Write-Host "   vercel login" -ForegroundColor White
        }
    } catch {
        Write-Host "⚠️  Error checking Vercel environment variables: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 To view/edit environment variables:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   2. Select project: $ProjectName" -ForegroundColor White
    Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor White
    Write-Host ""
}

# Check Vercel deployment logs
function Check-VercelLogs {
    Write-SectionHeader "📋 VERCEL DEPLOYMENT LOGS"
    
    if (!(Test-VercelCLI)) {
        Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
        Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Write-Host "📦 Recent Deployments:" -ForegroundColor Cyan
    Write-Host ("-" * 80) -ForegroundColor Gray
    
    try {
        $deployments = vercel ls $ProjectName --yes 2>&1
        if ($LASTEXITCODE -eq 0 -and $deployments) {
            $deployments | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "  ⚠️  No deployments found or project not found" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "💡 To deploy:" -ForegroundColor Yellow
            Write-Host "   vercel --prod" -ForegroundColor White
            Write-Host ""
            return
        }
    } catch {
        Write-Host "  ⚠️  Could not fetch deployments: $_" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-SubSection "🔍 Latest Deployment Logs"
    
    try {
        # Get latest deployment URL
        $deployments = vercel ls $ProjectName --yes 2>&1
        $latestDeployment = $deployments | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1
        
        if ($null -eq $latestDeployment) {
            Write-Host "  ⚠️  No deployment URL found" -ForegroundColor Yellow
            Write-Host ""
            return
        }
        
        $deploymentUrl = $latestDeployment.Line.Trim()
        Write-Host "  Deployment URL: $deploymentUrl" -ForegroundColor Green
        Write-Host ""
        
        # Get logs
        Write-Host "  Fetching logs (last $LogLines lines)..." -ForegroundColor Cyan
        Write-Host ("  " + ("-" * 76)) -ForegroundColor Gray
        
        
        if ($FollowLogs) {
            Write-Host "  Following logs in real-time (Press Ctrl+C to stop)..." -ForegroundColor Yellow
            Write-Host ""
            vercel logs $deploymentUrl --follow 2>&1
        } else {
            $logs = vercel logs $deploymentUrl --follow=$false 2>&1 | Select-Object -Last $LogLines
            if ($logs) {
                # Color code logs
                $logs | ForEach-Object {
                    $line = $_
                    if ($line -match 'error|Error|ERROR|fail|Fail|FAIL|exception|Exception') {
                        Write-Host "  $line" -ForegroundColor Red
                    } elseif ($line -match 'warn|Warn|WARN|warning|Warning') {
                        Write-Host "  $line" -ForegroundColor Yellow
                    } elseif ($line -match 'info|Info|INFO|log|Log') {
                        Write-Host "  $line" -ForegroundColor Cyan
                    } else {
                        Write-Host "  $line" -ForegroundColor Gray
                    }
                }
            } else {
                Write-Host "  ⚠️  No logs found or error accessing logs" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "  ❌ Error fetching logs: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-SubSection "📝 Manual Log Access"
    Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  2. Select project: $ProjectName" -ForegroundColor White
    Write-Host "  3. Click on the latest deployment" -ForegroundColor White
    Write-Host "  4. Go to the 'Functions' tab to see function-specific logs" -ForegroundColor White
    Write-Host "  5. Or use: vercel logs <deployment-url> --follow" -ForegroundColor White
    Write-Host ""
}

# Main execution
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PayAid V3 - Environment Variables & Vercel Logs Verification            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Verify local environment
$localSummary = Verify-LocalEnv

# Check Vercel environment variables
Verify-VercelEnv

# Check Vercel logs
Check-VercelLogs

# Final summary
Write-SectionHeader "✅ VERIFICATION COMPLETE"

if ($localSummary.CriticalSet -lt $localSummary.CriticalTotal -or $localSummary.CriticalIssues -gt 0) {
    Write-Host "❌ ACTION REQUIRED: Fix critical issues before deployment!" -ForegroundColor Red
    Write-Host ""
    exit 1
} elseif ($localSummary.CriticalSet -eq $localSummary.CriticalTotal) {
    Write-Host "✅ All critical environment variables are set!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Some important variables may be missing. Review above." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

