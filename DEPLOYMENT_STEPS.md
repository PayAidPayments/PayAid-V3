# PayAid V3 Deployment Steps (Windows/PowerShell)

## Step 1: Backup Landing Page (Safety First)

### Option A: Manual Backup (Recommended)

Run these commands in PowerShell:

```powershell
# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".backup/landing-page-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir

# Backup landing page
Copy-Item "app/page.tsx" "$backupDir/page.tsx" -Force

# Backup login page if exists
if (Test-Path "app/login/page.tsx") {
    New-Item -ItemType Directory -Force -Path "$backupDir/login" | Out-Null
    Copy-Item "app/login/page.tsx" "$backupDir/login/page.tsx" -Force
}

# Backup signup page if exists
if (Test-Path "app/signup/page.tsx") {
    New-Item -ItemType Directory -Force -Path "$backupDir/signup" | Out-Null
    Copy-Item "app/signup/page.tsx" "$backupDir/signup/page.tsx" -Force
}

Write-Host "Backup created: $backupDir" -ForegroundColor Green
```

### Option B: Use Bash Script (if Git Bash/WSL available)

```bash
chmod +x scripts/preserve-landing-page.sh
./scripts/preserve-landing-page.sh
```

This creates a backup in `.backup/landing-page-*/` with a restore script.

## Step 2: Verify Landing Page is Intact

Quick check - should show your landing page code:

```powershell
Get-Content app\page.tsx -Head 30
```

Or view the first few lines:

```powershell
Get-Content app\page.tsx | Select-Object -First 30
```

## Step 3: Push to GitHub (Landing Page Stays)

Add all new code (landing page file stays unchanged):

```powershell
git add .
```

Commit:

```powershell
git commit -m "feat: Deploy PayAid V3 complete platform (landing page preserved)"
```

Push to main:

```powershell
git push origin main
```

## Step 4: Vercel Auto-Deploys

- Vercel detects the push
- Builds and deploys automatically
- `app/page.tsx` remains unchanged
- All other code is replaced

## Step 5: Verify (5 minutes after deployment)

Check landing page loads:

```powershell
# Replace 'your-domain.com' with your actual domain
$response = Invoke-WebRequest -Uri "https://your-domain.com/"
$response.Content | Select-Object -First 50
```

Or check status:

```powershell
Invoke-WebRequest -Uri "https://your-domain.com/" -Method Head
```

Should show your landing page HTML.

## Troubleshooting

### If Landing Page is Broken After Deployment

1. Navigate to backup directory:
   ```powershell
   cd .backup\landing-page-*
   ```

2. Run restore script:
   ```powershell
   .\restore.ps1
   ```

3. Commit and push:
   ```powershell
   git add app\page.tsx
   git commit -m "fix: Restore landing page"
   git push origin main
   ```

### Check Git Status Before Deployment

```powershell
git status
```

Make sure `app/page.tsx` is NOT in the list of modified files. If it is, you may want to restore it first:

```powershell
git checkout app\page.tsx
```

## Quick Deployment Checklist

- [ ] Backup created (`.backup/landing-page-*/`)
- [ ] Landing page verified (`app/page.tsx` exists and looks correct)
- [ ] Git status checked (no unexpected changes to `app/page.tsx`)
- [ ] All changes committed
- [ ] Pushed to `main` branch
- [ ] Vercel deployment triggered
- [ ] Landing page verified after deployment (5 minutes wait)
- [ ] All features working correctly

## Notes

- The landing page (`app/page.tsx`) should remain unchanged during deployment
- All other code will be updated
- Vercel will automatically build and deploy on push to `main`
- Wait 5 minutes after push before verifying deployment