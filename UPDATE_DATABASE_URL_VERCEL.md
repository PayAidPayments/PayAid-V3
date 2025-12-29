# 🔧 Quick Fix: Update DATABASE_URL in Vercel

## 🎯 Problem

Vercel can't see database tables because it's using the **Transaction Pooler** connection string, which may route to a different database.

## ✅ Solution: Use Direct Connection

### Step 1: Get Direct Connection String

Your **Direct Connection** string is:
```
postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
```

**Note:** The password `@` is URL-encoded as `%40`.

---

### Step 2: Update in Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: **payaid-v3**

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Edit DATABASE_URL:**
   - Find `DATABASE_URL` in the list
   - Click **Edit** (pencil icon)
   - **Replace** the entire value with:
     ```
     postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
     ```
   - Make sure it's set for **Production** and **Preview**
   - Click **Save**

4. **Redeploy:**
   - Vercel will auto-redeploy, or click **Deployments** → **Redeploy**

---

### Step 3: Test

After redeploy (2-3 minutes), try creating admin user:

```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

**Expected:** Success message (no 500 error)

---

## 🔍 Why This Works

- **Direct Connection:** Connects directly to your database (port 5432)
- **Pooler Connection:** Routes through a pooler (port 6543) which may route to a different database instance
- **Schema Parameter:** `?schema=public` ensures Prisma looks in the correct schema

---

**Time:** ~5 minutes
**Status:** Ready to Fix

