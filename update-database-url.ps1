# PowerShell script to update DATABASE_URL in Vercel using Session Pooler
# This fixes the "Can't reach database server" error

$sessionPoolerUrl = "postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?schema=public"

Write-Host "`n🔄 Updating DATABASE_URL in Vercel to Session Pooler...`n" -ForegroundColor Cyan

# Update Production
Write-Host "📦 Updating Production environment..." -ForegroundColor Yellow
Write-Host "Removing old DATABASE_URL..." -ForegroundColor Gray
vercel env rm DATABASE_URL production --yes 2>&1 | Out-Null

Write-Host "Adding Session Pooler connection string..." -ForegroundColor Gray
$sessionPoolerUrl | vercel env add DATABASE_URL production 2>&1 | Out-Null
Write-Host "✅ Production updated" -ForegroundColor Green

# Update Preview
Write-Host "`n📦 Updating Preview environment..." -ForegroundColor Yellow
Write-Host "Removing old DATABASE_URL..." -ForegroundColor Gray
vercel env rm DATABASE_URL preview --yes 2>&1 | Out-Null

Write-Host "Adding Session Pooler connection string..." -ForegroundColor Gray
$sessionPoolerUrl | vercel env add DATABASE_URL preview 2>&1 | Out-Null
Write-Host "✅ Preview updated" -ForegroundColor Green

Write-Host "`n✅ DATABASE_URL updated successfully!`n" -ForegroundColor Green
Write-Host "⏳ Vercel will auto-redeploy. Wait 2-3 minutes, then test:" -ForegroundColor Cyan
Write-Host "`n1. Create admin user:" -ForegroundColor Yellow
Write-Host '   $body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '   Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
Write-Host "`n2. Test login at: https://payaid-v3.vercel.app/login`n" -ForegroundColor Yellow

