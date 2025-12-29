# 🔧 Fix: Tables Don't Exist on Vercel

## 🎯 Problem

Vercel is getting error: **"The table `public.User` does not exist in the current database"**

But locally, tables exist (134 tables found).

## 🔍 Root Cause

**Connection Pooler Issue:** The Transaction pooler connection string might be routing to a different database instance or schema than the direct connection.

**Solution:** Use **Direct Connection** instead of Pooler for Vercel.

---

## ✅ Fix: Switch to Direct Connection

### Step 1: Get Direct Connection String from Supabase

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ssbzexbhyifpafnvdaxn

2. **Navigate to Database Settings:**
   - Click **Settings** → **Database**

3. **Get Direct Connection:**
   - Scroll to **Connection string** section
   - Select **URI** tab (NOT Connection Pooling)
   - Copy the connection string
   - Format: `postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres`
   - **Important:** Replace `[YOUR-PASSWORD]` with your actual password
   - **Add `?schema=public`** at the end

**Direct Connection Format:**
```
postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
```

**Key Differences:**
- Host: `db.ssbzexbhyifpafnvdaxn.supabase.co` (not `pooler.supabase.com`)
- Port: `5432` (not `6543`)
- Username: `postgres.ssbzexbhyifpafnvdaxn` (same format)

---

### Step 2: Update DATABASE_URL in Vercel

**Option A: Via Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select project: **payaid-v3**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit**
6. Replace with **Direct Connection** string (from Step 1)
7. Click **Save**

**Option B: Via Vercel CLI**

```powershell
# Remove old pooler connection
vercel env rm DATABASE_URL production
vercel env rm DATABASE_URL preview

# Add direct connection
echo "postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public" | vercel env add DATABASE_URL production

echo "postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public" | vercel env add DATABASE_URL preview
```

**⚠️ Important:** 
- URL-encode special characters in password (e.g., `@` becomes `%40`)
- Your password is: `x7RV7sVVfFvxApQ@8` → encode `@` as `%40`
- So password becomes: `x7RV7sVVfFvxApQ%408`

---

### Step 3: Push Schema to Database

After updating DATABASE_URL, ensure tables exist:

```powershell
# Pull new environment variables
vercel env pull .env.production

# Set DATABASE_URL from .env.production
$envContent = Get-Content .env.production
$dbUrl = ($envContent | Select-String "DATABASE_URL").ToString().Split("=", 2)[1].Trim('"')
$env:DATABASE_URL = $dbUrl

# Push schema
npx prisma db push --skip-generate
```

---

### Step 4: Redeploy

Vercel will auto-redeploy when you update environment variables. Or manually:

```powershell
vercel --prod
```

---

### Step 5: Create Admin User

After redeploy, try creating admin user again:

```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

---

## 🐛 Alternative: Check Database Name

If direct connection still doesn't work, verify:

1. **Check which database you're connected to:**
   ```sql
   SELECT current_database();
   ```

2. **List all databases:**
   ```sql
   SELECT datname FROM pg_database;
   ```

3. **Check if tables exist in a different schema:**
   ```sql
   SELECT schemaname, tablename FROM pg_tables WHERE tablename ILIKE '%user%';
   ```

---

## 📋 Quick Checklist

- [ ] Got Direct Connection string from Supabase
- [ ] Updated `DATABASE_URL` in Vercel (Production & Preview)
- [ ] URL-encoded password special characters
- [ ] Added `?schema=public` to connection string
- [ ] Pushed schema to database (`prisma db push`)
- [ ] Redeployed on Vercel
- [ ] Created admin user successfully
- [ ] Login works

---

## 🎯 Expected Result

After switching to direct connection:
- ✅ Vercel can see all tables
- ✅ Admin user creation works
- ✅ Login works
- ✅ All features functional

---

**Time to Fix:** ~10 minutes
**Status:** Ready to Fix

