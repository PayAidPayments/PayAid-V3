# ⚡ Quick Fix: Database Connection on Vercel

## 🎯 Current Status

❌ **No environment variables found in Vercel**
- This is why you're getting the database connection error

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Get Supabase Connection String

1. Go to: https://supabase.com/dashboard/project/zjcutguakjavahdrytxc
2. Click **Settings** → **Database**
3. Scroll to **Connection Pooling** section
4. Copy the **Transaction** mode connection string
5. It looks like: `postgresql://postgres.zjcutguakjavahdrytxc:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
6. **Replace `[PASSWORD]`** with your actual database password
7. **Add `?schema=public`** at the end

**Don't know your password?**
- Click **Reset database password** in Supabase Dashboard
- Set a new password and use it in the connection string

---

### Step 2: Add to Vercel (3 ways)

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dashboard
2. Select project: **payaid-v3**
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Your connection string from Step 1
   - **Environments:** ✅ Production, ✅ Preview
6. Click **Save**

#### Option B: Via Vercel CLI

```powershell
# Add DATABASE_URL
vercel env add DATABASE_URL production

# When prompted, paste your connection string
# Repeat for preview environment:
vercel env add DATABASE_URL preview
```

#### Option C: Bulk Add (Recommended)

Add all required variables at once via CLI:

```powershell
# First, generate secrets
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$nextAuthSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$encryptionKey = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Then add each variable (replace values)
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add NEXTAUTH_URL production
vercel env add APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NODE_ENV production
vercel env add JWT_EXPIRES_IN production
```

---

### Step 3: Run Database Migrations

After adding `DATABASE_URL`, create the database tables:

```powershell
# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**Or use Prisma DB Push:**
```powershell
# Set DATABASE_URL temporarily
$env:DATABASE_URL="your-connection-string-here"

# Push schema
npx prisma db push
```

---

### Step 4: Redeploy

Vercel will auto-redeploy when you add environment variables. Or manually:

```powershell
vercel --prod
```

---

## ✅ Verify It Works

1. **Check Vercel Logs:**
   ```powershell
   vercel logs payaid-v3.vercel.app
   ```

2. **Test Dashboard:**
   - Visit: https://payaid-v3.vercel.app/dashboard
   - Should load without database error

3. **Test Connection Locally:**
   ```powershell
   # Set DATABASE_URL
   $env:DATABASE_URL="your-connection-string"
   
   # Test
   npx tsx scripts/test-db-connection.ts
   ```

---

## 📋 Required Environment Variables Checklist

Add these to Vercel (Production environment):

- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `JWT_SECRET` - Random 64-char hex (generate with node command)
- [ ] `JWT_EXPIRES_IN` - Set to `"24h"`
- [ ] `NEXTAUTH_URL` - `https://payaid-v3.vercel.app`
- [ ] `NEXTAUTH_SECRET` - Random 64-char hex
- [ ] `NODE_ENV` - `"production"`
- [ ] `APP_URL` - `https://payaid-v3.vercel.app`
- [ ] `NEXT_PUBLIC_APP_URL` - `https://payaid-v3.vercel.app`
- [ ] `ENCRYPTION_KEY` - Random 64-char hex

**Generate Secrets:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🆘 Still Having Issues?

1. **Check Connection String Format:**
   - Must include `?schema=public` at the end
   - Password must be URL-encoded (special chars)
   - For pooler: Use port `6543`, not `5432`

2. **Check Supabase Status:**
   - Free tier projects auto-pause after inactivity
   - Go to Supabase Dashboard and check if project is active
   - If paused, click "Resume" or "Restore"

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for Prisma error codes (P1001, P1000, etc.)

---

**Time to Fix:** ~5 minutes
**Difficulty:** Easy
**Status:** Ready to Fix

