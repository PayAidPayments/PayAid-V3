# PowerShell script to update DATABASE_URL in Vercel
# This script updates the DATABASE_URL to use direct connection instead of pooler

$directConnection = "postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public"

Write-Host "🔄 Updating DATABASE_URL in Vercel..." -ForegroundColor Cyan
Write-Host ""

# Update Production
Write-Host "📦 Updating Production environment..." -ForegroundColor Yellow
$directConnection | vercel env rm DATABASE_URL production --yes 2>&1 | Out-Null
$directConnection | vercel env add DATABASE_URL production 2>&1 | Out-Null
Write-Host "✅ Production updated" -ForegroundColor Green

# Update Preview
Write-Host "📦 Updating Preview environment..." -ForegroundColor Yellow
$directConnection | vercel env rm DATABASE_URL preview --yes 2>&1 | Out-Null
$directConnection | vercel env add DATABASE_URL preview 2>&1 | Out-Null
Write-Host "✅ Preview updated" -ForegroundColor Green

Write-Host ""
Write-Host "✅ DATABASE_URL updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Vercel will auto-redeploy. Wait 2-3 minutes, then test:" -ForegroundColor Cyan
Write-Host '   $body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '   Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray

