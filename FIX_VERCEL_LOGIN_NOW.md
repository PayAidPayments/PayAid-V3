# 🔧 Fix Login Issue on Vercel - Quick Guide

## 🎯 Problem
Unable to login at https://payaid-v3.vercel.app/login with `admin@demo.com` / `Test@1234`

## ✅ Solution: Create Admin User

The user doesn't exist in the Vercel database yet. Use one of these methods to create it:

---

## Method 1: PowerShell Script (Windows - Easiest)

```powershell
.\scripts\create-admin-user-vercel.ps1
```

---

## Method 2: Browser Console (Quickest)

1. Open https://payaid-v3.vercel.app/login
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Paste and run:

```javascript
fetch('https://payaid-v3.vercel.app/api/admin/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'Test@1234'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Success!', data);
  alert('User created! You can now login.');
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Failed: ' + err.message);
});
```

---

## Method 3: PowerShell Command

```powershell
$body = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## Method 4: curl (if you have it)

```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

---

## Method 5: TypeScript Script

```bash
VERCEL_URL=https://payaid-v3.vercel.app npx tsx scripts/create-admin-user-vercel.ts
```

---

## ✅ After Creating User

1. Go to: https://payaid-v3.vercel.app/login
2. Enter:
   - **Email:** `admin@demo.com`
   - **Password:** `Test@1234`
3. Click **"Sign in"**
4. Should login successfully! 🎉

---

## 🔍 Troubleshooting

### Still Getting "Login failed"?

1. **Verify user was created:**
   - Check the response from the API call
   - Should show: `"User admin@demo.com created successfully"` or `"Password reset successfully"`

2. **Check email normalization:**
   - Make sure you're using lowercase: `admin@demo.com` (not `Admin@Demo.com`)
   - The system normalizes emails automatically, but it's best to use lowercase

3. **Check Vercel Logs:**
   ```bash
   vercel logs payaid-v3.vercel.app
   ```
   Look for login errors in the logs

4. **Verify Environment Variables:**
   - `DATABASE_URL` must be set in Vercel
   - `JWT_SECRET` must be set in Vercel

---

## 📋 What Was Fixed

1. ✅ **Email normalization** - Reset-password endpoint now normalizes emails like the login route
2. ✅ **Error handling** - Better error messages and logging
3. ✅ **User creation** - Endpoint can create user if it doesn't exist

---

**Time to Fix:** ~1 minute  
**Difficulty:** Easy  
**Status:** Ready to Fix







