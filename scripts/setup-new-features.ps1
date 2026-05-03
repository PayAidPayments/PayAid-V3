# PayAid V3 - Setup Script for New Features (Windows PowerShell)
# This script helps set up the new features: Loyalty, Suppliers, Email Bounce, SMS

Write-Host "🚀 PayAid V3 - New Features Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Migration
Write-Host "Step 1: Running database migration..." -ForegroundColor Yellow
try {
    npx prisma migrate dev --name add_loyalty_supplier_email_sms_models
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migration completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Database migration failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Database migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "Step 2: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma client generation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Prisma client generation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check Environment Variables
Write-Host "Step 3: Checking environment variables..." -ForegroundColor Yellow

$requiredVars = @("DATABASE_URL")
$optionalVars = @("SENDGRID_API_KEY", "TWILIO_ACCOUNT_SID", "EXOTEL_API_KEY")

$missingRequired = @()
foreach ($var in $requiredVars) {
    if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
        $missingRequired += $var
    }
}

if ($missingRequired.Count -eq 0) {
    Write-Host "✅ Required environment variables are set" -ForegroundColor Green
} else {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingRequired) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these in your .env file"
}

$missingOptional = @()
foreach ($var in $optionalVars) {
    if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
        $missingOptional += $var
    }
}

if ($missingOptional.Count -gt 0) {
    Write-Host "⚠️  Optional environment variables not set (features may not work):" -ForegroundColor Yellow
    foreach ($var in $missingOptional) {
        Write-Host "  - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "See SETUP_GUIDE.md for configuration instructions"
}

Write-Host ""

# Step 4: Summary
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure webhooks (see SETUP_GUIDE.md):"
Write-Host "   - SendGrid webhook for email bounces"
Write-Host "   - Twilio/Exotel webhooks for SMS delivery reports"
Write-Host ""
Write-Host "2. Test the features:"
Write-Host "   - Create a loyalty program"
Write-Host "   - Add a supplier"
Write-Host "   - Send a test SMS"
Write-Host ""
Write-Host "3. Review API documentation in COMPLETE_IMPLEMENTATION_SUMMARY.md"

