# PayAid V3 - Login Testing Script
# Run this script to test login functionality after deployment

$baseUrl = "https://payaid-v3.vercel.app"

Write-Host "`n=== PayAid V3 Login Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Database Health Check
Write-Host "1. Testing Database Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health/db" -Method GET
    if ($healthResponse.status -eq "healthy") {
        Write-Host "   ✅ Database is healthy" -ForegroundColor Green
        Write-Host "   - Query Time: $($healthResponse.queryTimeMs)ms" -ForegroundColor Gray
        Write-Host "   - User Table Exists: $($healthResponse.userTableExists)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Database is unhealthy" -ForegroundColor Red
        Write-Host "   Error: $($healthResponse.error)" -ForegroundColor Red
        if ($healthResponse.code) {
            Write-Host "   Code: $($healthResponse.code)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Login API
Write-Host "2. Testing Login API..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   - User: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   - Role: $($loginResponse.user.role)" -ForegroundColor Gray
    Write-Host "   - Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
    if ($loginResponse.tenant) {
        Write-Host "   - Tenant: $($loginResponse.tenant.name)" -ForegroundColor Gray
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorResponse) {
        Write-Host "   ❌ Login failed: $($errorResponse.message)" -ForegroundColor Red
        if ($errorResponse.step) {
            Write-Host "   Failed at step: $($errorResponse.step)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Invalid Credentials
Write-Host "3. Testing Invalid Credentials..." -ForegroundColor Yellow
$invalidBody = @{
    email = "invalid@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $invalidBody
    Write-Host "   ⚠️  Unexpected success with invalid credentials" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Correctly rejected invalid credentials (401)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Unexpected error: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Vercel logs if any tests failed" -ForegroundColor Gray
Write-Host "2. Verify environment variables in Vercel Dashboard" -ForegroundColor Gray
Write-Host "3. Test login page at: $baseUrl/login" -ForegroundColor Gray
Write-Host ""

