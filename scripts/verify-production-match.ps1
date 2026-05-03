# Verify Local Landing Page Matches Production
# This script helps ensure localhost matches Vercel production

Write-Host "🔍 Verifying Landing Page Status..." -ForegroundColor Cyan
Write-Host ""

# Check if production backup exists
if (Test-Path "app/page.production-backup.tsx") {
    Write-Host "✅ Production backup exists: app/page.production-backup.tsx" -ForegroundColor Green
} else {
    Write-Host "⚠️  No production backup found" -ForegroundColor Yellow
}

# Check current git status
Write-Host ""
Write-Host "📋 Current Git Status:" -ForegroundColor Cyan
git status app/page.tsx --short

Write-Host ""
Write-Host "📝 Latest commits affecting landing page:" -ForegroundColor Cyan
git log --oneline -5 -- app/page.tsx

Write-Host ""
Write-Host "💡 To work locally:" -ForegroundColor Yellow
Write-Host "   1. Run: npm run dev" -ForegroundColor White
Write-Host "   2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Make changes to app/page.tsx" -ForegroundColor White
Write-Host "   4. Test thoroughly before pushing" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To deploy to production:" -ForegroundColor Yellow
Write-Host "   git add app/page.tsx" -ForegroundColor White
Write-Host "   git commit -m `"feat: Landing page updates`"" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
