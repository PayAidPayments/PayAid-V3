# 🔧 Fix Database Connection Error on Vercel

## 🎯 Problem

You're seeing this error on your Vercel deployment:
```
🗄️ Database Connection Error
Database connection failed. Please check your DATABASE_URL configuration.
```

**Root Cause:** `DATABASE_URL` environment variable is not configured in Vercel.

---

## ✅ Solution: Configure DATABASE_URL in Vercel

### Step 1: Get Your Supabase Database Connection String

You already have a Supabase project set up:
- **Project Reference:** `zjcutguakjavahdrytxc`
- **Project URL:** https://zjcutguakjavahdrytxc.supabase.co

**Get the Connection String:**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/zjcutguakjavahdrytxc

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon) → **Database**

3. **Get Connection Pooling URL (Recommended for Vercel):**
   - Scroll to **Connection Pooling** section
   - Select **Transaction** mode
   - Copy the connection string
   - Format: `postgresql://postgres.zjcutguakjavahdrytxc:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
   - **Important:** Replace `[PASSWORD]` with your actual database password
   - If you don't know it, click **Reset database password** first

4. **Alternative: Direct Connection (if pooler doesn't work):**
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy: `postgresql://postgres:[PASSWORD]@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres`
   - Add `?schema=public` at the end

---

### Step 2: Add DATABASE_URL to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: **payaid-v3** (or your project name)

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Add DATABASE_URL:**
   - Click **Add New**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your Supabase connection string (from Step 1)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

**Example Value:**
```
postgresql://postgres.zjcutguakjavahdrytxc:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public
```

**⚠️ Important:** 
- URL-encode special characters in password (e.g., `@` becomes `%40`)
- Use connection pooler URL for better performance on Vercel

---

### Step 3: Add Other Required Environment Variables

While you're in Vercel Settings, also add these **required** variables:

#### Generate Secrets First:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NEXTAUTH_SECRET (run again)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (run again)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Add to Vercel:

1. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: (64-character hex string from above)
   - Environments: ✅ Production, ✅ Preview

2. **JWT_EXPIRES_IN**
   - Key: `JWT_EXPIRES_IN`
   - Value: `24h`
   - Environments: ✅ Production, ✅ Preview

3. **NEXTAUTH_URL**
   - Key: `NEXTAUTH_URL`
   - Value: `https://payaid-v3.vercel.app` (or your actual URL)
   - Environments: ✅ Production

4. **NEXTAUTH_SECRET**
   - Key: `NEXTAUTH_SECRET`
   - Value: (64-character hex string from above)
   - Environments: ✅ Production, ✅ Preview

5. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Environments: ✅ Production

6. **APP_URL**
   - Key: `APP_URL`
   - Value: `https://payaid-v3.vercel.app` (or your actual URL)
   - Environments: ✅ Production

7. **NEXT_PUBLIC_APP_URL**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://payaid-v3.vercel.app` (or your actual URL)
   - Environments: ✅ Production

8. **ENCRYPTION_KEY**
   - Key: `ENCRYPTION_KEY`
   - Value: (64-character hex string from above)
   - Environments: ✅ Production, ✅ Preview

---

### Step 4: Run Database Migrations

After setting `DATABASE_URL`, you need to create the database tables.

**Option A: Using Vercel CLI (Recommended)**

```bash
# Make sure you're in the project directory
cd "D:\Cursor Projects\PayAid V3"

# Pull environment variables from Vercel
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Prisma DB Push (Alternative)**

```bash
# Set DATABASE_URL locally (temporarily)
$env:DATABASE_URL="your-production-database-url"

# Push schema to database
npx prisma db push
```

**Option C: Using Supabase SQL Editor**

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy your Prisma schema SQL
3. Run it in the SQL Editor

---

### Step 5: Redeploy on Vercel

After adding environment variables:

1. **Automatic Redeploy:**
   - Vercel will automatically redeploy when you save environment variables
   - Wait for the deployment to complete (2-5 minutes)

2. **Manual Redeploy (if needed):**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **Redeploy**

---

### Step 6: Verify It Works

1. **Check Vercel Logs:**
   - Go to **Deployments** → Latest deployment → **Functions** tab
   - Look for any database connection errors

2. **Test the Dashboard:**
   - Visit: https://payaid-v3.vercel.app/dashboard
   - The database connection error should be gone

3. **Test API Endpoint:**
   ```bash
   curl https://payaid-v3.vercel.app/api/dashboard/stats
   ```

---

## 🐛 Troubleshooting

### Still Getting Database Error?

1. **Check Connection String Format:**
   - Make sure password is URL-encoded
   - Verify it includes `?schema=public` at the end
   - For pooler: Use port `6543`, not `5432`

2. **Check Vercel Logs:**
   - Go to **Deployments** → Latest → **Functions** → `/api/dashboard/stats`
   - Look for Prisma error codes:
     - `P1001`: Connection timeout/refused
     - `P1000`: Authentication failed
     - `P1002`: Connection timeout

3. **Test Connection Locally:**
   ```bash
   # Set DATABASE_URL
   $env:DATABASE_URL="your-connection-string"
   
   # Test connection
   npx prisma db pull
   ```

4. **Verify Database is Accessible:**
   - Check Supabase Dashboard → **Database** → **Connection Pooling**
   - Ensure pooler is enabled
   - Check if project is paused (free tier auto-pauses after inactivity)

5. **Check Environment Variable Scope:**
   - Make sure `DATABASE_URL` is set for **Production** environment
   - Not just Preview or Development

---

## 📋 Quick Checklist

- [ ] Got Supabase connection string (pooler recommended)
- [ ] Added `DATABASE_URL` to Vercel (Production environment)
- [ ] Added `JWT_SECRET` to Vercel
- [ ] Added `NEXTAUTH_URL` and `NEXTAUTH_SECRET` to Vercel
- [ ] Added `ENCRYPTION_KEY` to Vercel
- [ ] Added `APP_URL` and `NEXT_PUBLIC_APP_URL` to Vercel
- [ ] Ran database migrations (`prisma migrate deploy` or `prisma db push`)
- [ ] Redeployed on Vercel
- [ ] Tested dashboard - no more database error

---

## 🎉 Success!

Once all steps are complete, your Vercel deployment should connect to the database successfully, and the dashboard will load without errors.

**Next Steps:**
- Create admin user (if not exists)
- Seed initial data (optional)
- Test all features

---

**Last Updated:** January 2025
**Status:** Ready to Fix

