# Setup Team Access to Vercel Deployments
# Creates team access document and provides instructions
# 
# Usage: .\scripts\setup-team-access.ps1

Write-Host "Setting up team access to deployments..." -ForegroundColor Green
Write-Host ""

Write-Host "=== Option 1: Direct URL Access (Simplest) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Get deployment URLs from Vercel dashboard" -ForegroundColor White
Write-Host "2. Share URLs with team members" -ForegroundColor White
Write-Host "3. Team can access directly - no login needed" -ForegroundColor White
Write-Host ""
Write-Host "Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Option 2: Vercel Team Access (Recommended) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Steps to add team members:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://vercel.com/teams/[your-team]/settings/members" -ForegroundColor Yellow
Write-Host "2. Click 'Invite Member'" -ForegroundColor White
Write-Host "3. Enter team member email" -ForegroundColor White
Write-Host "4. Select role: 'Viewer' (recommended)" -ForegroundColor White
Write-Host "5. Send invitation" -ForegroundColor White
Write-Host ""
Write-Host "Viewer Role Benefits:" -ForegroundColor Green
Write-Host "  ✅ Can see all deployments" -ForegroundColor White
Write-Host "  ✅ Can access live URLs" -ForegroundColor White
Write-Host "  ✅ Can view deployment logs" -ForegroundColor White
Write-Host "  ❌ Cannot see GitHub code" -ForegroundColor White
Write-Host "  ❌ Cannot modify deployments" -ForegroundColor White
Write-Host ""

Write-Host "=== Option 3: Password Protection ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Requires Vercel Pro ($20/month):" -ForegroundColor Yellow
Write-Host "1. Go to project settings" -ForegroundColor White
Write-Host "2. Navigate to 'Deployment Protection'" -ForegroundColor White
Write-Host "3. Enable 'Password Protection'" -ForegroundColor White
Write-Host "4. Set password and share with team" -ForegroundColor White
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Get actual URLs from Vercel dashboard" -ForegroundColor White
Write-Host "2. Update TEAM_ACCESS_URLS.md with real URLs" -ForegroundColor White
Write-Host "3. Share document with team members" -ForegroundColor White
Write-Host "4. (Optional) Add team to Vercel as Viewers" -ForegroundColor White
Write-Host ""

Write-Host "Team access document created: TEAM_ACCESS_URLS.md" -ForegroundColor Green
Write-Host "Update it with actual Vercel URLs from your dashboard." -ForegroundColor Yellow

