# 🚀 Start Dev Server - PowerShell Guide

## ✅ You Don't Need Bash/WSL!

You can use **PowerShell directly** - no bash needed!

---

## 🚀 Quick Start (PowerShell)

### In your PowerShell terminal, run:

```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

**That's it!** The server will start and show output in the terminal.

---

## ✅ Expected Output

When the server starts successfully, you'll see:

```
▲ Next.js 14.2.33
- Local:        http://localhost:3000

✓ Ready in Xms
○ Local: http://localhost:3000
```

**Then open:** `http://localhost:3000` in your browser.

---

## 🔧 Troubleshooting

### Issue: "npm is not recognized"

**Solution:** Make sure Node.js is installed and in your PATH.

**Check:**
```powershell
node --version
npm --version
```

If these don't work, install Node.js from: https://nodejs.org/

---

### Issue: Port 3000 Already in Use

**Check what's using port 3000:**
```powershell
netstat -ano | Select-String ":3000"
```

**Kill the process:**
```powershell
# Get the PID from netstat output, then:
taskkill /PID <pid> /F
```

**Or use a different port:**
```powershell
npm run dev -- -p 3001
```

---

### Issue: Database Connection Error

**Check your `.env` file has:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"
```

**Verify PostgreSQL is running:**
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

---

### Issue: Missing Dependencies

**Install dependencies:**
```powershell
npm install
```

---

## 📋 Step-by-Step Instructions

1. **Open PowerShell in Cursor:**
   - Press `` Ctrl + ` `` (backtick) to open terminal
   - Or: Terminal → New Terminal

2. **Navigate to project:**
   ```powershell
   cd "d:\Cursor Projects\PayAid V3"
   ```

3. **Start the server:**
   ```powershell
   npm run dev
   ```

4. **Wait for compilation** (15-30 seconds)

5. **Open browser:**
   ```
   http://localhost:3000
   ```

---

## ✅ Verification

**Check if server is running:**
```powershell
netstat -ano | Select-String ":3000" | Select-String "LISTENING"
```

If you see output → Server is running ✅

---

## 🎯 Summary

**You don't need bash or WSL!** Just use PowerShell:

```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

Wait 15-30 seconds, then open `http://localhost:3000`

---

**Last Updated:** December 20, 2025
