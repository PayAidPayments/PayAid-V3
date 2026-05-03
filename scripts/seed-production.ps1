# Production Seeding Script
# Sets up Session Pooler connection and runs migrations + seeding

$ErrorActionPreference = "Stop"

Write-Host "`n🌱 Production Seeding Script`n" -ForegroundColor Cyan

# Step 1: Get production connection string
Write-Host "📋 Step 1: Loading production connection string..." -ForegroundColor Yellow
$poolerUrl = (Get-Content .env.production | Select-String "DATABASE_URL").ToString() -replace 'DATABASE_URL=', '' -replace '"', ''
$poolerUrl = $poolerUrl.Trim() -replace '\\r\\n', '' -replace '\r\n', ''

# Convert to Session Pooler (port 6543)
$sessionUrl = $poolerUrl -replace ':5432/', ':6543/'
$amp = [char]38
if ($sessionUrl -match '\?schema=public') {
    $sessionUrl = $sessionUrl -replace '\?schema=public', "?pgbouncer=true$amp`schema=public"
} else {
    $sessionUrl = $sessionUrl + "?pgbouncer=true$amp`schema=public"
}

Write-Host "✅ Connection string ready`n" -ForegroundColor Green

# Step 2: Run migrations
Write-Host "🔄 Step 2: Running migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = $sessionUrl
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migrations failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations complete`n" -ForegroundColor Green

# Step 3: Wait for connection pool
Write-Host "⏳ Waiting 10 seconds for connection pool to clear..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Run seeder
Write-Host "🌱 Step 3: Running demo business seeder..." -ForegroundColor Yellow
npm run seed:demo-business
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Seeding failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Seeding complete`n" -ForegroundColor Green

# Step 5: Validate
Write-Host "✅ Step 4: Validating data..." -ForegroundColor Yellow
npm run validate:demo-data
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Validation found issues" -ForegroundColor Yellow
} else {
    Write-Host "✅ Validation passed`n" -ForegroundColor Green
}

Write-Host "`n🎉 Production seeding complete!`n" -ForegroundColor Cyan
