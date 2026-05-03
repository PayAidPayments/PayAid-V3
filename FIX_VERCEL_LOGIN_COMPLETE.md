# ✅ Fix Vercel Login - Complete Guide

## 🎯 Problem

Login is failing on https://payaid-v3.vercel.app/login with error: "The table `public.User` does not exist in the current database."

## 🔍 Root Cause

The database tables exist locally, but Vercel might be:
1. Using a different DATABASE_URL
2. Connecting to a different database instance
3. Having connection pooler routing issues

---

## ✅ Solution

### Step 1: Verify Database Connection on Vercel

The admin user exists in the database (we verified locally). The issue is that Vercel can't see the tables.

**Possible causes:**
- Connection pooler routing to different database
- DATABASE_URL mismatch
- Schema/database name mismatch

### Step 2: Try Creating User via API (If Tables Exist)

If the tables actually exist on Vercel's connection:

```powershell
$body = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

### Step 3: Check Vercel Logs

```bash
vercel logs payaid-v3.vercel.app
```

Look for:
- Database connection errors
- Table not found errors
- Which DATABASE_URL is being used

### Step 4: Verify DATABASE_URL in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: **payaid-v3**
3. Go to **Settings** → **Environment Variables**
4. Verify `DATABASE_URL` is set correctly
5. Check it's set for **Production** environment

### Step 5: Use Direct Connection (If Pooler Issue)

If connection pooler is causing issues, try using the direct connection string:

1. Go to Supabase Dashboard → Settings → Database
2. Get **Direct Connection** (not pooler)
3. Update `DATABASE_URL` in Vercel with direct connection
4. Redeploy

**Direct connection format:**
```
postgresql://postgres:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
```

---

## 🔑 Login Credentials

Once the database is accessible:

- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

---

## 🐛 Troubleshooting

### Error: "Table does not exist"

**Solution 1: Push Schema Again**
```bash
vercel env pull .env.production
# Set DATABASE_URL from .env.production
npx prisma db push
```

**Solution 2: Check Connection String**
- Verify DATABASE_URL includes `?schema=public`
- Check if using correct database name
- Ensure connection string is URL-encoded

**Solution 3: Use Direct Connection**
- Switch from pooler to direct connection
- Pooler might route to different database

### Error: "Database connection failed"

1. Check Supabase project is active (not paused)
2. Verify DATABASE_URL is correct
3. Check firewall/network settings
4. Try direct connection instead of pooler

---

## 📋 Quick Checklist

- [ ] Verified DATABASE_URL in Vercel
- [ ] Checked Vercel logs for errors
- [ ] Tried creating user via API
- [ ] Verified database connection works locally
- [ ] Tried direct connection if pooler fails
- [ ] Login successful

---

## 🎉 Expected Result

After fixing:
- ✅ Can access database from Vercel
- ✅ Tables are visible
- ✅ Can create/login with admin user
- ✅ Login works at https://payaid-v3.vercel.app/login

---

**Status:** 🔧 In Progress - Database Connection Issue
**Next Step:** Verify DATABASE_URL and connection type in Vercel

