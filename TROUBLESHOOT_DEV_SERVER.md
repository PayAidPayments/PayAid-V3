# Troubleshooting: ERR_CONNECTION_REFUSED

## 🔍 Issue: Server Not Starting

If you're getting `ERR_CONNECTION_REFUSED`, the dev server is not running.

---

## ✅ Solution: Start the Server

### Option 1: Start in Background (Already Done)
The server was started in the background. Wait 10-20 seconds for compilation.

### Option 2: Start Manually (If Background Failed)

**Open a new terminal in Cursor:**
1. Press `` Ctrl + ` `` (backtick) to open terminal
2. Run:
   ```bash
   npm run dev
   ```

**Or use PowerShell:**
```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

---

## 🔍 Check Server Status

### Method 1: Check Port
```powershell
netstat -ano | Select-String ":3000"
```

**If you see `LISTENING`** → Server is running ✅  
**If nothing** → Server is not running ❌

### Method 2: Check Browser
1. Open: `http://localhost:3000`
2. If page loads → Server is running ✅
3. If ERR_CONNECTION_REFUSED → Server not running ❌

---

## 🐛 Common Issues

### Issue 1: Port 3000 Already in Use

**Check:**
```powershell
netstat -ano | Select-String ":3000"
```

**Solution:**
```powershell
# Find the PID from netstat output
# Then kill it:
taskkill /PID <pid> /F

# Or use different port:
npm run dev -- -p 3001
```

### Issue 2: Build Errors

**Check terminal output for:**
- TypeScript errors
- Prisma client errors
- Missing dependencies

**Common errors:**
- `Cannot find module '@prisma/client'` → Run `npm install`
- Prisma type errors → Run `npx prisma generate` (when Cursor is closed)
- Missing dependencies → Run `npm install`

### Issue 3: Database Connection

**Check `.env` file:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"
```

**Verify PostgreSQL is running:**
```powershell
# Check if PostgreSQL is running
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

---

## 🚀 Quick Start Commands

### Start Server:
```bash
npm run dev
```

### Check if Running:
```bash
# In another terminal:
curl http://localhost:3000
# Or just open browser: http://localhost:3000
```

### Stop Server:
```bash
# Press Ctrl+C in the terminal running npm run dev
```

---

## ✅ Expected Output

When server starts successfully, you should see:

```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Ready in Xms

✓ Ready in Xms
○ Local: http://localhost:3000
```

---

## 🎯 Next Steps

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Wait 10-20 seconds** for compilation

3. **Open browser:**
   ```
   http://localhost:3000
   ```

4. **If still not working:**
   - Check terminal for errors
   - Verify all dependencies installed: `npm install`
   - Check database connection
   - Try restarting Cursor

---

**The server should be starting now. Wait 10-20 seconds, then refresh `http://localhost:3000`**
