# Verify DATABASE_URL Format ✅

## Quick Check

Run this in your terminal (in project root) to see your DATABASE_URL format:

```bash
# Windows PowerShell
$env:DATABASE_URL

# Windows CMD  
echo %DATABASE_URL%

# Mac/Linux
echo $DATABASE_URL
```

## What to Look For

### ✅ CORRECT Format (Transaction Mode):
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key Points:**
- ✅ Hostname includes `pooler.supabase.com`
- ✅ Port is `6543`
- ✅ Includes `?pgbouncer=true`

### ❌ WRONG Format (Session Mode - Causes Errors):
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Issues:**
- ❌ Hostname is `db.xxxxx.supabase.co` (not pooler)
- ❌ Port is `5432` (session mode)
- ❌ No `?pgbouncer=true`

## How to Fix

### Step 1: Get Transaction Mode Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **Database**
4. Scroll to **Connection String** section
5. Select **Transaction mode** (port 6543)
6. Copy the connection string

### Step 2: Update .env.local

Replace your DATABASE_URL with the Transaction mode string:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** Replace `[PASSWORD]` with your actual database password.

### Step 3: Restart Server

```bash
# Stop (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Check Terminal Logs

After restarting, you should see:
```
[PRISMA] DATABASE_URL detected: { hostname: '...pooler.supabase.com...', originalPort: '6543', ... }
[PRISMA] Switched Supabase pooler to transaction mode (port 6543)
[PRISMA] Connection limit set to 10 (transaction mode, localhost)
```

If you see these messages, your connection is correct ✅

## Common Issues

### Issue 1: Still Using Port 5432

**Symptom:** Terminal shows `originalPort: '5432'`

**Solution:** Update DATABASE_URL to use port 6543

### Issue 2: Not Using Pooler Hostname

**Symptom:** Hostname is `db.xxxxx.supabase.co` instead of `pooler.supabase.com`

**Solution:** Get connection string from Supabase Dashboard → Transaction mode

### Issue 3: Missing pgbouncer Parameter

**Symptom:** No `?pgbouncer=true` in URL

**Solution:** Add `?pgbouncer=true` to the end of DATABASE_URL

## Expected Result

After fixing DATABASE_URL:
- ✅ No more "connection pool exhausted" errors
- ✅ Dashboard loads successfully
- ✅ Terminal shows transaction mode messages
- ✅ Connection limit is 10 (for localhost)

## Still Having Issues?

If you've verified DATABASE_URL is correct but still getting errors:

1. **Check terminal logs** - Look for Prisma connection messages
2. **Verify Supabase project is active** - Not paused
3. **Try reducing concurrent requests** - The dashboard makes many API calls
4. **Check connection limit** - Should be 10 for localhost

The connection limit is now set to 10 for localhost (up from 3), which should handle concurrent requests better!
