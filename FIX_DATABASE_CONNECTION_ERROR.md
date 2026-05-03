# 🔧 Fix: Can't Reach Database Server Error

## 🎯 Current Error

**Error:** `Can't reach database server at db.ssbzexbhyifpafnvdaxn.supabase.co:5432`

This means Vercel can't connect to Supabase's direct connection port (5432) because:
1. **Supabase free tier** may pause databases after inactivity
2. **Firewall/IP restrictions** may block direct connections
3. **Serverless environments** (like Vercel) may need connection pooling

---

## ✅ Solution: Use Session Pooler Instead

For Vercel (serverless), we should use **Session Pooler** instead of Direct Connection.

### Step 1: Get Session Pooler Connection String

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ssbzexbhyifpafnvdaxn
   - Click **Settings** → **Database**

2. **Get Connection Pooling String:**
   - Scroll to **Connection Pooling** section
   - Select **Session** mode (NOT Transaction)
   - Copy the connection string
   - Format should be:
     ```
     postgresql://postgres.ssbzexbhyifpafnvdaxn:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
     ```
   - **Important:** Use port **5432** (Session mode), NOT 6543 (Transaction mode)
   - Add `?schema=public` at the end

3. **URL-encode the password:**
   - If password is `x7RV7sVVfFvxApQ@8`
   - Encode `@` as `%40`
   - Result: `x7RV7sVVfFvxApQ%408`

### Step 2: Update DATABASE_URL in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select: **payaid-v3**
   - Click: **Settings** → **Environment Variables**

2. **Update DATABASE_URL:**
   - Find `DATABASE_URL` (Production & Preview)
   - Click **Edit**
   - **Replace** with Session Pooler connection string:
     ```
     postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public
     ```
   - **Note:** The host might be different (check your Supabase dashboard)
   - **Important:** Port must be **5432** (Session mode)
   - Click **Save**

3. **Wait for Redeploy:**
   - Vercel auto-redeploys (2-3 minutes)

---

## 🔍 Alternative: Check Supabase Database Status

### If Database is Paused

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ssbzexbhyifpafnvdaxn
   - Check if database shows "Paused" status

2. **Resume Database:**
   - Click **Resume** if paused
   - Wait 1-2 minutes for database to start

3. **Try Again:**
   - After database resumes, try creating admin user again

---

## 🔍 Verify Connection String Format

The connection string should be:
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

**Example (Session Pooler):**
```
postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public
```

**Key Points:**
- ✅ Use **Session Pooler** (port 5432) for serverless
- ✅ URL-encode password (`@` → `%40`)
- ✅ Include `?schema=public` at the end
- ✅ Host format: `[region].pooler.supabase.com`

---

## 🧪 Test After Fix

### Step 1: Create Admin User

```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

**Expected:** Success response (no 500 error)

### Step 2: Test Login

1. Go to: https://payaid-v3.vercel.app/login
2. Email: `admin@demo.com`
3. Password: `Test@1234`
4. Should login successfully ✅

---

## 🚨 If Still Not Working

### Check Vercel Logs

```powershell
vercel logs payaid-v3.vercel.app --follow
```

Look for:
- Connection timeout errors
- Authentication failures
- Database pause errors

### Verify Supabase Settings

1. **Check Database Status:**
   - Supabase Dashboard → Project Settings
   - Ensure database is **Active** (not paused)

2. **Check Connection Pooling:**
   - Settings → Database → Connection Pooling
   - Ensure **Session mode** is enabled
   - Copy the correct connection string

3. **Check IP Restrictions:**
   - Settings → Database → Network Restrictions
   - Ensure Vercel IPs are allowed (or set to allow all)

---

## 📋 Connection String Comparison

| Type | Port | Use Case | Format |
|------|------|----------|--------|
| **Direct** | 5432 | Local/dev | `db.[project].supabase.co:5432` |
| **Session Pooler** | 5432 | Serverless | `[region].pooler.supabase.com:5432` |
| **Transaction Pooler** | 6543 | Serverless (limited) | `[region].pooler.supabase.com:6543` |

**For Vercel:** Use **Session Pooler** (port 5432)

---

## ✅ Success Checklist

- [ ] Got Session Pooler connection string from Supabase
- [ ] URL-encoded password (`@` → `%40`)
- [ ] Updated DATABASE_URL in Vercel (Production & Preview)
- [ ] Used port 5432 (Session mode)
- [ ] Added `?schema=public` at the end
- [ ] Vercel redeployed successfully
- [ ] Database is active (not paused)
- [ ] Admin user creation works
- [ ] Login works

---

**Status:** Ready to Fix  
**Time Required:** 5-10 minutes  
**Priority:** Critical (blocks all functionality)

