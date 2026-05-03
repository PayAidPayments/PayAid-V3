# 🔧 Fix Login Failed on Vercel

## 🎯 Problem

Login is failing on https://payaid-v3.vercel.app/login with "Login failed" error.

## 🔍 Root Cause

The database is connected, but **no user exists yet**. We need to create an admin user first.

---

## ✅ Solution: Create Admin User

### Option 1: Use API Endpoint (Easiest)

Call the reset-password endpoint to create the admin user:

**Using PowerShell:**
```powershell
$body = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

**Using curl:**
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

**Using Browser Console:**
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
.then(console.log)
```

### Option 2: Run Database Seed (If you have local access)

If you can connect to the database locally:

```bash
# Pull environment variables
vercel env pull .env.production

# Run seed script
npx tsx prisma/seed.ts
```

---

## 🔑 Login Credentials

After creating the user, you can login with:

- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

---

## ✅ Verification

1. **Create the user** (using Option 1 above)
2. **Go to:** https://payaid-v3.vercel.app/login
3. **Enter credentials:**
   - Email: `admin@demo.com`
   - Password: `Test@1234`
4. **Click "Sign in"**
5. **Should login successfully!**

---

## 🐛 Troubleshooting

### Still Getting "Login failed"?

1. **Check Vercel Logs:**
   ```bash
   vercel logs payaid-v3.vercel.app
   ```
   Look for login errors and see which step failed

2. **Verify User Was Created:**
   - Check the response from the reset-password API
   - Should show: `"User admin@demo.com created successfully"`

3. **Check Database Connection:**
   - Verify `DATABASE_URL` is set in Vercel
   - Test connection: `npx tsx scripts/test-db-connection.ts`

4. **Check JWT_SECRET:**
   - Verify `JWT_SECRET` is set in Vercel
   - Should be a 64-character hex string

---

## 📋 Quick Checklist

- [ ] Called `/api/admin/reset-password` endpoint
- [ ] User created successfully (check API response)
- [ ] Tried logging in with `admin@demo.com` / `Test@1234`
- [ ] Login successful

---

## 🎉 Expected Result

After creating the user:
- ✅ Can login at https://payaid-v3.vercel.app/login
- ✅ Dashboard loads successfully
- ✅ All features accessible

---

**Time to Fix:** ~1 minute
**Difficulty:** Easy
**Status:** Ready to Fix

