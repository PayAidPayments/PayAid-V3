# PowerShell script to test database connection and verify deployment
# Tests admin user creation, checks deployment status, and verifies environment variables

$baseUrl = "https://payaid-v3.vercel.app"
$projectName = "payaid-v3"

Write-Host "`n🔍 Database Connection Test & Deployment Verification`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Vercel Deployment Status
Write-Host "1️⃣  Checking Vercel Deployment Status..." -ForegroundColor Yellow
Write-Host "   Project: $projectName" -ForegroundColor Gray
Write-Host "   URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

try {
    # Check if vercel CLI is available
    $vercelVersion = vercel --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Vercel CLI is installed" -ForegroundColor Green
        
        # List deployments
        Write-Host "`n   📋 Recent Deployments:" -ForegroundColor Cyan
        $deployments = vercel ls $projectName --json 2>&1 | ConvertFrom-Json
        if ($deployments) {
            $latest = $deployments | Select-Object -First 1
            Write-Host "      Latest: $($latest.url)" -ForegroundColor Gray
            Write-Host "      State: $($latest.state)" -ForegroundColor $(if ($latest.state -eq "READY") { "Green" } else { "Yellow" })
            Write-Host "      Created: $($latest.created)" -ForegroundColor Gray
        } else {
            Write-Host "      ⚠️  No deployments found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not check Vercel CLI: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Verify Environment Variables
Write-Host "2️⃣  Verifying Environment Variables..." -ForegroundColor Yellow
Write-Host ""

try {
    if ($vercelVersion) {
        Write-Host "   📋 Checking DATABASE_URL in Vercel..." -ForegroundColor Cyan
        $envVars = vercel env ls $projectName --json 2>&1 | ConvertFrom-Json
        if ($envVars) {
            $dbUrl = $envVars | Where-Object { $_.key -eq "DATABASE_URL" } | Select-Object -First 1
            if ($dbUrl) {
                Write-Host "      ✅ DATABASE_URL found" -ForegroundColor Green
                $urlPreview = $dbUrl.value -replace ':[^:@]+@', ':****@'  # Mask password
                Write-Host "      Value: $urlPreview" -ForegroundColor Gray
                
                # Check if it's using direct connection (port 5432) or pooler (port 6543)
                if ($dbUrl.value -match ':5432/') {
                    Write-Host "      ✅ Using Direct Connection (port 5432)" -ForegroundColor Green
                } elseif ($dbUrl.value -match ':6543/') {
                    Write-Host "      ⚠️  Using Transaction Pooler (port 6543)" -ForegroundColor Yellow
                    Write-Host "      💡 Consider switching to direct connection for better table visibility" -ForegroundColor Yellow
                }
            } else {
                Write-Host "      ❌ DATABASE_URL not found in Vercel" -ForegroundColor Red
                Write-Host "      💡 Add it via: vercel env add DATABASE_URL production" -ForegroundColor Yellow
            }
        } else {
            Write-Host "      ⚠️  Could not retrieve environment variables" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Install Vercel CLI to check environment variables" -ForegroundColor Yellow
        Write-Host "      Or check manually at: https://vercel.com/dashboard" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Could not verify environment variables: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test Admin User Creation
Write-Host "3️⃣  Testing Admin User Creation..." -ForegroundColor Yellow
Write-Host "   Endpoint: $baseUrl/api/admin/reset-password" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        email = "admin@demo.com"
        password = "Test@1234"
    } | ConvertTo-Json

    Write-Host "   📤 Sending request..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "   ✅ Admin user created/reset successfully!" -ForegroundColor Green
        Write-Host "      Message: $($response.message)" -ForegroundColor Gray
        Write-Host "      Email: $($response.email)" -ForegroundColor Gray
        Write-Host "      Password: $($response.password)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   🎉 Database connection is working!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Response received but success=false" -ForegroundColor Yellow
        Write-Host "      Message: $($response.message)" -ForegroundColor Gray
    }
} catch {
    $errorMsg = $_.Exception.Message
    $statusCode = $null
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $errorMsg = $errorBody
        } catch {
            # Could not read error body
        }
    }
    
    Write-Host "   ❌ Admin user creation failed!" -ForegroundColor Red
    Write-Host "      Status: $statusCode" -ForegroundColor Gray
    Write-Host "      Error: $errorMsg" -ForegroundColor Gray
    Write-Host ""
    
    if ($statusCode -eq 500) {
        Write-Host "   🔍 Possible Issues:" -ForegroundColor Yellow
        Write-Host "      1. DATABASE_URL not configured in Vercel" -ForegroundColor Gray
        Write-Host "      2. Database connection string is incorrect" -ForegroundColor Gray
        Write-Host "      3. Database tables don't exist (run: npx prisma db push)" -ForegroundColor Gray
        Write-Host "      4. Database server is not accessible" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   💡 Check Vercel logs:" -ForegroundColor Cyan
        Write-Host "      vercel logs $projectName --follow" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 4: Check if Redeploy is Needed
Write-Host "4️⃣  Checking if Redeploy is Needed..." -ForegroundColor Yellow
Write-Host ""

if ($vercelVersion) {
    Write-Host "   💡 To trigger a redeploy:" -ForegroundColor Cyan
    Write-Host "      1. Update environment variables in Vercel Dashboard" -ForegroundColor Gray
    Write-Host "      2. Or run: vercel --prod" -ForegroundColor Gray
    Write-Host "      3. Or push a new commit to trigger auto-deploy" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📝 To update DATABASE_URL via CLI:" -ForegroundColor Cyan
    Write-Host "      vercel env rm DATABASE_URL production" -ForegroundColor Gray
    Write-Host "      echo 'YOUR_CONNECTION_STRING' | vercel env add DATABASE_URL production" -ForegroundColor Gray
} else {
    Write-Host "   💡 Install Vercel CLI to manage deployments:" -ForegroundColor Cyan
    Write-Host "      npm i -g vercel" -ForegroundColor Gray
    Write-Host "      vercel login" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Test Complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "📊 Quick Summary:" -ForegroundColor Cyan
Write-Host "   • Deployment URL: $baseUrl" -ForegroundColor Gray
Write-Host "   • Admin Email: admin@demo.com" -ForegroundColor Gray
Write-Host "   • Admin Password: Test@1234" -ForegroundColor Gray
Write-Host "   • Login URL: $baseUrl/login" -ForegroundColor Gray
Write-Host ""










