# Fix Prisma Lock Issue (EPERM Error)

## 🔴 Problem
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...'
```

This means Prisma files are locked by a running process (usually the dev server).

## ✅ Solution

### Method 1: Close Everything (Recommended)
1. **Close ALL terminals** (including the one running `npm run dev`)
2. **Close VS Code/Cursor completely**
3. **Wait 5 seconds**
4. **Reopen VS Code/Cursor**
5. **Open a NEW terminal**
6. **Run:** `npx prisma generate`

### Method 2: Kill Node Processes Manually
1. Open **Task Manager** (Ctrl+Shift+Esc)
2. Go to **Details** tab
3. Find all **node.exe** processes
4. **End Task** for each one (especially ones using high CPU/Memory)
5. **Run:** `npx prisma generate`

### Method 3: Use PowerShell (Run as Administrator)
```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 3 seconds
Start-Sleep -Seconds 3

# Clean temp files
Remove-Item "node_modules\.prisma\client\*.tmp*" -Force -ErrorAction SilentlyContinue

# Generate Prisma
npx prisma generate
```

### Method 4: Restart Computer
If nothing else works, restart your computer, then run `npx prisma generate`.

## 🎯 After Fixing

Once `npx prisma generate` succeeds:
1. **Start dev server:** `npm run dev`
2. **Test Voice Agent:** Go to `/voice-agents/[tenant-id]/New`
3. **Create an agent** - should work now!

## ⚠️ Prevention

To avoid this in the future:
- Always stop the dev server (Ctrl+C) before running `npx prisma generate`
- Don't run multiple dev servers at the same time
- Close unused terminals

