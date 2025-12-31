# 🔧 Fix: DATABASE_URL Not Set in Vercel

## 🎯 Problem

You're seeing this error on your Vercel deployment:
```
⚠️ Something went wrong!
DATABASE_URL environment variable is not set. Please configure it in your environment variables.
```

**Root Cause:** The `DATABASE_URL` environment variable is not configured in Vercel's production environment.

---

## ✅ Solution: Add DATABASE_URL to Vercel

### Step 1: Get Your Database Connection String

You need a **cloud-hosted PostgreSQL database**. If you're using **Supabase**:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon) → **Database**

3. **Get Connection String:**
   
   **Option A: Direct Connection (Recommended for Vercel)**
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy the connection string
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public`
   - **Important:** Replace `[PASSWORD]` with your actual database password
   - If you don't know it, click **Reset database password** first

   **Option B: Connection Pooling (Alternative)**
   - Scroll to **Connection Pooling** section
   - Select **Transaction** mode
   - Copy the connection string
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Note:** Pooling is better for serverless but may have limitations

---

### Step 2: Add DATABASE_URL to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: **payaid-v3**

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Add DATABASE_URL:**
   - Click **Add New**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your database connection string (from Step 1)
   - **Environment:** ✅ Select **Production**, ✅ **Preview**, ✅ **Development**
   - Click **Save**

4. **Verify:**
   - You should see `DATABASE_URL` listed in the environment variables
   - Make sure it's set for **Production** environment

---

### Step 3: Add Other Required Environment Variables

While you're in the Environment Variables section, also add these **critical** variables:

#### 🔴 **CRITICAL - Must Have**

```env
# JWT Authentication
JWT_SECRET="[generate-random-64-char-hex]"
JWT_EXPIRES_IN="24h"

# NextAuth
NEXTAUTH_URL="https://payaid-v3.vercel.app"
NEXTAUTH_SECRET="[generate-random-64-char-hex]"

# App Configuration
NODE_ENV="production"
APP_URL="https://payaid-v3.vercel.app"
NEXT_PUBLIC_APP_URL="https://payaid-v3.vercel.app"

# Encryption Key (for API keys at rest)
ENCRYPTION_KEY="[generate-random-64-char-hex]"
```

**Generate Random Secrets:**
```bash
# Generate JWT_SECRET, NEXTAUTH_SECRET, or ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 4: Redeploy

After adding environment variables:

1. **Automatic Redeploy:**
   - Vercel will automatically trigger a new deployment
   - Wait 2-3 minutes for deployment to complete

2. **Manual Redeploy (if needed):**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on the latest deployment
   - Click **Redeploy**

3. **Verify:**
   - Visit: https://payaid-v3.vercel.app/dashboard
   - The error should be resolved

---

## 🔍 Troubleshooting

### If Error Persists:

1. **Check Environment Variable Scope:**
   - Make sure `DATABASE_URL` is set for **Production** environment
   - Preview and Development environments are optional but recommended

2. **Verify Connection String Format:**
   - Should start with `postgresql://`
   - Should include password (URL-encoded if special characters)
   - Should end with `?schema=public` (for direct connection)

3. **Check Database Access:**
   - Verify your Supabase project is not paused
   - Check if database password is correct
   - Ensure database is accessible from external IPs

4. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → **Logs**
   - Look for database connection errors

5. **Test Connection String:**
   - Try connecting with a PostgreSQL client (pgAdmin, DBeaver, etc.)
   - If it works locally, it should work on Vercel

---

## 📋 Quick Checklist

- [ ] Got database connection string from Supabase
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Set for **Production** environment
- [ ] Added other required environment variables (JWT_SECRET, etc.)
- [ ] Redeployed application
- [ ] Verified deployment works

---

## 🆘 Still Having Issues?

If you're still seeing the error after following these steps:

1. **Check Vercel Build Logs:**
   - Look for any errors during build
   - Check if environment variables are being read

2. **Verify Supabase Project:**
   - Make sure project is active (not paused)
   - Check database is running

3. **Contact Support:**
   - Vercel Support: https://vercel.com/support
   - Supabase Support: https://supabase.com/support

---

**Status:** ⚠️ **ACTION REQUIRED** - Add DATABASE_URL to Vercel

