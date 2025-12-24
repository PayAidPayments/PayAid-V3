# Fix Prisma File Lock Error (EPERM)

## 🔴 Error Message
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp...' -> 'query_engine-windows.dll.node'
```

## ✅ Solution Steps (Try in Order)

### Step 1: Stop ALL Node Processes
1. **Close the dev server** (if running):
   - Press `Ctrl+C` in the terminal
   - Wait for it to fully stop

2. **Close ALL terminal windows** that might have Node processes

3. **Check for running Node processes:**
   ```powershell
   # In PowerShell, run:
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

### Step 2: Close IDE/Editor
1. **Close VS Code/Cursor** (if you have Prisma files open)
2. **Or:** Close and reopen the IDE
3. **Wait 10 seconds** after closing

### Step 3: Delete Locked Files Manually
```powershell
# Navigate to the project directory
cd "d:\Cursor Projects\PayAid V3"

# Delete the Prisma client directory
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Wait 5 seconds
Start-Sleep -Seconds 5
```

### Step 4: Regenerate Prisma Client
```bash
npx prisma generate
```

---

## 🔧 Alternative: Use --skip-generate Flag

If you just need to push schema changes without regenerating:

```bash
npx prisma db push --skip-generate
```

Then regenerate later when processes are stopped.

---

## 🛠️ Nuclear Option (If Nothing Works)

1. **Close ALL applications** (IDE, terminals, browsers with dev tools)
2. **Restart your computer** (this releases all file locks)
3. **After restart:**
   ```bash
   cd "d:\Cursor Projects\PayAid V3"
   npx prisma generate
   ```

---

## ✅ Quick PowerShell Script

Run this in PowerShell to stop all Node processes and regenerate:

```powershell
# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 5 seconds
Start-Sleep -Seconds 5

# Navigate to project
cd "d:\Cursor Projects\PayAid V3"

# Delete Prisma client
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Wait again
Start-Sleep -Seconds 3

# Regenerate
npx prisma generate
```

---

## 🎯 Most Common Cause

**The dev server is still running in the background.**

**Solution:**
1. Open Task Manager (`Ctrl+Shift+Esc`)
2. Look for "Node.js" processes
3. End all Node.js processes
4. Wait 5 seconds
5. Try `npx prisma generate` again

---

## 📝 After Success

Once `npx prisma generate` succeeds, continue with:

```bash
npm run db:seed
npm run dev
```
