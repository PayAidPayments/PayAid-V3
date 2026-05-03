# 🚀 Start Dev Server - Manual Instructions

## ⚠️ Server is NOT Running

The background start failed. Please start it manually to see errors.

---

## ✅ Step-by-Step Instructions

### 1. Open PowerShell Terminal in Cursor

**Press:** `` Ctrl + ` `` (backtick key, usually above Tab)

**Or:** Terminal → New Terminal

---

### 2. Navigate to Project

```powershell
cd "d:\Cursor Projects\PayAid V3"
```

---

### 3. Start the Server

```powershell
npm run dev
```

---

### 4. Watch for Output

You should see one of these:

**✅ Success:**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000

✓ Ready in Xms
○ Local: http://localhost:3000
```

**❌ Error Examples:**
```
Error: Cannot find module '@prisma/client'
→ Solution: Run `npm install`

Error: Port 3000 is already in use
→ Solution: Kill the process or use port 3001

Error: Database connection failed
→ Solution: Check DATABASE_URL in .env file
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "npm is not recognized"

**Solution:** Node.js is not installed or not in PATH.

**Check:**
```powershell
node --version
npm --version
```

**If these fail:** Install Node.js from https://nodejs.org/

---

### Issue 2: "Cannot find module"

**Solution:** Install dependencies:
```powershell
npm install
```

---

### Issue 3: "Port 3000 is already in use"

**Solution A:** Kill the process:
```powershell
# Find what's using port 3000
netstat -ano | Select-String ":3000"

# Kill it (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Solution B:** Use different port:
```powershell
npm run dev -- -p 3001
```

---

### Issue 4: Database Connection Error

**Check `.env` file exists and has:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"
```

**Verify PostgreSQL is running:**
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

---

### Issue 5: TypeScript/Prisma Errors

**If you see Prisma errors:**
```powershell
npx prisma generate
```

**If you see TypeScript errors:**
- These are usually warnings and won't prevent the server from starting
- Fix them later if needed

---

## ✅ Once Server Starts

1. **Wait for:** `✓ Ready in Xms`
2. **Open browser:** `http://localhost:3000`
3. **You should see:** PayAid login page

---

## 🎯 Quick Command Summary

```powershell
# 1. Navigate
cd "d:\Cursor Projects\PayAid V3"

# 2. Start server
npm run dev

# 3. Wait for "Ready" message
# 4. Open http://localhost:3000
```

---

**Please run `npm run dev` in your terminal and share any errors you see!**
