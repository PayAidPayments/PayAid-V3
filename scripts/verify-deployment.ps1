# PowerShell script to verify PayAid V3 deployment
# Tests all critical endpoints and functionality

$baseUrl = "https://payaid-v3.vercel.app"
$errors = @()
$success = @()

Write-Host "`n🔍 PayAid V3 Deployment Verification`n" -ForegroundColor Cyan
Write-Host "Testing: $baseUrl`n" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "1. Testing health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Health check passed" -ForegroundColor Green
    $success += "Health check"
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors += "Health check"
}

# Test 2: Admin Password Reset
Write-Host "`n2. Testing admin password reset..." -ForegroundColor Yellow
try {
    $body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    if ($response.success) {
        Write-Host "   ✅ Admin password reset successful" -ForegroundColor Green
        $success += "Admin password reset"
    } else {
        Write-Host "   ❌ Admin password reset failed: $($response.message)" -ForegroundColor Red
        $errors += "Admin password reset"
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorMsg = $reader.ReadToEnd()
    }
    Write-Host "   ❌ Admin password reset failed: $errorMsg" -ForegroundColor Red
    $errors += "Admin password reset"
}

# Test 3: Login
Write-Host "`n3. Testing login..." -ForegroundColor Yellow
try {
    $body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    if ($response.token) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        $success += "Login"
        $token = $response.token
    } else {
        Write-Host "   ❌ Login failed: No token received" -ForegroundColor Red
        $errors += "Login"
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorMsg = $reader.ReadToEnd()
    }
    Write-Host "   ❌ Login failed: $errorMsg" -ForegroundColor Red
    $errors += "Login"
    $token = $null
}

# Test 4: AI Co-Founder Endpoint (if token available)
if ($token) {
    Write-Host "`n4. Testing AI Co-Founder endpoint..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $body = @{ message = "Hello, test message" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/cofounder" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        if ($response.message -or $response.agent) {
            Write-Host "   ✅ AI Co-Founder endpoint working" -ForegroundColor Green
            $success += "AI Co-Founder"
        } else {
            Write-Host "   ⚠️  AI Co-Founder responded but no message" -ForegroundColor Yellow
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorMsg = $reader.ReadToEnd()
        }
        Write-Host "   ❌ AI Co-Founder failed: $errorMsg" -ForegroundColor Red
        $errors += "AI Co-Founder"
    }
}

# Test 5: Get Available Agents
if ($token) {
    Write-Host "`n5. Testing agents list..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/cofounder" -Method GET -Headers $headers -ErrorAction Stop
        if ($response.agents -and $response.agents.Count -gt 0) {
            Write-Host "   ✅ Agents list retrieved ($($response.agents.Count) agents)" -ForegroundColor Green
            $success += "Agents list"
        } else {
            Write-Host "   ⚠️  No agents found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Agents list failed: $($_.Exception.Message)" -ForegroundColor Red
        $errors += "Agents list"
    }
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host "✅ Successful: $($success.Count)" -ForegroundColor Green
Write-Host "❌ Failed: $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })

if ($success.Count -gt 0) {
    Write-Host "`n✅ Working:" -ForegroundColor Green
    $success | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Issues:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    Write-Host "`n💡 Check: COMPLETE_DATABASE_FIX.md for database connection issues" -ForegroundColor Yellow
}

Write-Host "`n" -ForegroundColor White

