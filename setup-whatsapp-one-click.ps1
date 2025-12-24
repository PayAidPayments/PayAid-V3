# WhatsApp One-Click Setup - Environment Configuration Script (PowerShell)

Write-Host "🔧 Setting up WhatsApp One-Click environment variables..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
    } else {
        New-Item -Path .env -ItemType File
    }
}

# Read .env file
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if ($null -eq $envContent) {
    $envContent = @()
}

# Add WhatsApp One-Click variables if not present
$needsUpdate = $false
if ($envContent -notmatch "INTERNAL_WAHA_BASE_URL") {
    $envContent += ""
    $envContent += "# WhatsApp One-Click Setup"
    $envContent += "INTERNAL_WAHA_BASE_URL=http://127.0.0.1"
    $envContent += "PAYAID_PUBLIC_URL=http://localhost:3000"
    $needsUpdate = $true
    Write-Host "✅ Added WhatsApp One-Click environment variables" -ForegroundColor Green
} else {
    Write-Host "✅ WhatsApp One-Click variables already exist" -ForegroundColor Green
}

if ($needsUpdate) {
    $envContent | Set-Content .env
}

# Check Docker
Write-Host ""
Write-Host "🐳 Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
        
        try {
            docker ps | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker is running" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Docker is installed but not running. Please start Docker Desktop." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  Docker is installed but not running. Please start Docker Desktop." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
}

# Check ports
Write-Host ""
Write-Host "🔌 Checking ports 3500-3600..." -ForegroundColor Cyan
try {
    $occupiedPorts = netstat -ano | Select-String -Pattern ":(350[0-9]|35[1-9][0-9]|3600)" | Measure-Object
    if ($occupiedPorts.Count -gt 0) {
        Write-Host "⚠️  Some ports in range 3500-3600 are occupied:" -ForegroundColor Yellow
        netstat -ano | Select-String -Pattern ":(350[0-9]|35[1-9][0-9]|3600)"
    } else {
        Write-Host "✅ Ports 3500-3600 are available" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not check ports (netstat may not be available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review .env file and update PAYAID_PUBLIC_URL if needed"
Write-Host "2. Run: npx prisma generate"
Write-Host "3. Run: npm run dev"
Write-Host "4. Navigate to: http://localhost:3000/dashboard/whatsapp/setup"
