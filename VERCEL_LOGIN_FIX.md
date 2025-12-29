# 🔧 Fix Login 500 Error on Vercel

## Problem
Getting "Login failed" with 500 Internal Server Error on `https://pay-aid-v3.vercel.app/login`

## Root Cause
The 500 error indicates a **server-side issue**, most likely:
1. ❌ `DATABASE_URL` not configured in Vercel
2. ❌ Database connection string pointing to `localhost` (won't work on Vercel)
3. ❌ Database not accessible from Vercel's servers

---

## ✅ Solution: Configure Database in Vercel

### Step 1: Get Production Database URL

You need a **cloud-hosted PostgreSQL database** (not localhost). Options:

**Option A: Supabase (Recommended - Free Tier Available)**
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)
5. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public`

**Option B: Other Cloud Databases**
- Neon (https://neon.tech) - Free tier
- Railway (https://railway.app) - Free tier
- AWS RDS, Google Cloud SQL, etc.

### Step 2: Add DATABASE_URL to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **PayAid V3**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Your production database connection string (from Step 1)
   - **Environment:** ✅ Production, ✅ Preview
6. Click **Save**

### Step 3: Add Other Required Variables

Also add these **required** environment variables:

```env
# JWT Authentication (REQUIRED)
JWT_SECRET="[generate-random-64-char-hex]"
JWT_EXPIRES_IN="24h"

# NextAuth (REQUIRED)
NEXTAUTH_URL="https://pay-aid-v3.vercel.app"
NEXTAUTH_SECRET="[generate-random-64-char-hex]"

# App Configuration (REQUIRED)
NODE_ENV="production"
APP_URL="https://pay-aid-v3.vercel.app"
NEXT_PUBLIC_APP_URL="https://pay-aid-v3.vercel.app"

# Encryption (REQUIRED)
ENCRYPTION_KEY="[generate-random-64-char-hex]"
```

**Generate Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Run Database Migrations

After setting `DATABASE_URL`, you need to create the database tables:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Prisma Studio (Alternative)**
```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# Push schema
npx prisma db push
```

### Step 5: Seed the Database

Create the admin user:

**Using API Endpoint:**
```bash
curl -X POST https://pay-aid-v3.vercel.app/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

**Or using PowerShell:**
```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://pay-aid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

### Step 6: Redeploy

After adding environment variables:
1. Vercel will **auto-redeploy** when you save environment variables
2. Or manually trigger: Go to **Deployments** → Click **"..."** → **Redeploy**

---

## ✅ Verify It Works

1. **Test Login API:**
   ```bash
   curl -X POST https://pay-aid-v3.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.com","password":"Test@1234"}'
   ```

2. **Test in Browser:**
   - Go to: https://pay-aid-v3.vercel.app/login
   - Email: `admin@demo.com`
   - Password: `Test@1234`
   - Should login successfully

---

## 🐛 Troubleshooting

### Still Getting 500 Error?

1. **Check Vercel Logs:**
   - Go to **Deployments** → Click latest deployment → **Functions** tab
   - Look for error logs in `/api/auth/login`

2. **Verify DATABASE_URL:**
   - Make sure it's not pointing to `localhost`
   - Test connection string locally:
     ```bash
     psql "your-database-url"
     ```

3. **Check Database Access:**
   - Ensure database allows connections from Vercel IPs
   - For Supabase: Check **Settings** → **Database** → **Connection Pooling**

4. **Verify Environment Variables:**
   - Make sure all required variables are set
   - Check they're set for **Production** environment (not just Preview)

---

## 📋 Quick Checklist

- [ ] Production database created (Supabase/Neon/etc.)
- [ ] `DATABASE_URL` added to Vercel (Production environment)
- [ ] `JWT_SECRET` added to Vercel
- [ ] `NEXTAUTH_URL` set to `https://pay-aid-v3.vercel.app`
- [ ] `NEXTAUTH_SECRET` added to Vercel
- [ ] `ENCRYPTION_KEY` added to Vercel
- [ ] Database migrations run (`prisma migrate deploy`)
- [ ] Admin user created (via `/api/admin/reset-password`)
- [ ] Vercel redeployed after adding variables
- [ ] Login tested and working

---

**Last Updated:** January 2025

