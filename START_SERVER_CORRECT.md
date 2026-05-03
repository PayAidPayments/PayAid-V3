# 🚀 Start Server - Correct Command

## ⚠️ Common Error

**Wrong:**
```powershell
cd d:\Cursor Projects\PayAid V3
```
❌ This fails because PowerShell sees multiple arguments

**Correct:**
```powershell
cd "d:\Cursor Projects\PayAid V3"
```
✅ Use quotes around paths with spaces

---

## ✅ Complete Command Sequence

### In PowerShell Terminal:

```powershell
# Step 1: Navigate (with quotes!)
cd "d:\Cursor Projects\PayAid V3"

# Step 2: Start server
npm run dev
```

---

## 🎯 Quick Copy-Paste

Copy and paste this entire block:

```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

---

## ✅ Expected Output

After running `npm run dev`, you should see:

```
▲ Next.js 14.2.33
- Local:        http://localhost:3000

✓ Ready in Xms
○ Local: http://localhost:3000
```

**Then open:** `http://localhost:3000`

---

## 💡 PowerShell Tips

### Always Quote Paths with Spaces

**✅ Correct:**
```powershell
cd "d:\Cursor Projects\PayAid V3"
cd 'd:\Cursor Projects\PayAid V3'
```

**❌ Wrong:**
```powershell
cd d:\Cursor Projects\PayAid V3
```

---

### Check Current Directory

```powershell
# See where you are
Get-Location
# or
pwd
```

---

### Verify You're in the Right Place

```powershell
# Should show: d:\Cursor Projects\PayAid V3
Get-Location

# Should show package.json
Test-Path package.json
```

---

## 🚀 Full Start Sequence

```powershell
# 1. Navigate to project
cd "d:\Cursor Projects\PayAid V3"

# 2. Verify you're in the right place
Get-Location

# 3. Start server
npm run dev

# 4. Wait 30-60 seconds

# 5. Open browser: http://localhost:3000
```

---

**Remember: Always use quotes around paths with spaces!**
