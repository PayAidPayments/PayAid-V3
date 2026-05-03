# Database Connection - Next Steps Completion Guide

## ✅ Next Steps Implementation

This guide helps you complete the next steps from `DATABASE_CONNECTION_PERMANENT_FIX.md`.

---

## Step 1: Update Vercel Environment Variables

### Current Status Check

Run the verification script:
```bash
npm run ts-node scripts/check-vercel-env.ts
```

### Required: DATABASE_URL

**Format for Supabase Session Pooler (Recommended):**
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public
```

**Key Points:**
- ✅ Use **Session Pooler** (port **5432**), NOT Transaction Pooler (6543)
- ✅ Host: `pooler.supabase.com` (not direct connection)
- ✅ Username: `postgres.PROJECT_REF` format
- ✅ Must include `?schema=public` at the end
- ✅ URL-encode special characters in password (e.g., `@` → `%40`)

### Optional: DATABASE_CONNECTION_LIMIT

**Recommended Value:**
```
DATABASE_CONNECTION_LIMIT=10
```

**Why:**
- Serverless (Vercel) benefits from smaller pools
- Prevents connection exhaustion
- Default is 10 if not set

---

## Step 2: How to Update in Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: **payaid-v3**

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Update DATABASE_URL:**
   - Find `DATABASE_URL` in the list
   - Click **Edit** (or **Add** if it doesn't exist)
   - Paste your Supabase Session Pooler connection string
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Add DATABASE_CONNECTION_LIMIT (Optional):**
   - Click **Add New**
   - Name: `DATABASE_CONNECTION_LIMIT`
   - Value: `10`
   - Select environments: **Production**, **Preview**
   - Click **Save**

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment
   - Or push a new commit to trigger redeploy

### Option B: Via Vercel CLI

```powershell
# Set DATABASE_URL
vercel env add DATABASE_URL production
# Paste your connection string when prompted

# Set DATABASE_CONNECTION_LIMIT (optional)
vercel env add DATABASE_CONNECTION_LIMIT production
# Enter: 10

# Redeploy
vercel --prod
```

---

## Step 3: Get Supabase Connection String

### Step-by-Step

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon) → **Database**

3. **Get Session Pooler Connection String:**
   - Scroll to **Connection Pooling** section
   - Select **Session** mode (NOT Transaction)
   - Copy the connection string
   - Format: `postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

4. **Add Schema Parameter:**
   - Add `?schema=public` at the end
   - Final format: `postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public`

5. **URL-Encode Password:**
   - If password contains special characters:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
     - etc.

---

## Step 4: Verify Setup

### Local Verification

Run the verification script:
```bash
npm run ts-node scripts/verify-database-connection-setup.ts
```

This will check:
- ✅ DATABASE_URL is set
- ✅ Connection string format is correct
- ✅ Connection pool parameters
- ✅ Database connection works
- ✅ Table access works

### Production Verification

1. **Test Health Check Endpoint:**
   ```bash
   curl https://payaid-v3.vercel.app/api/health/db
   ```

   **Expected Response:**
   ```json
   {
     "status": "healthy",
     "hasDatabaseUrl": true,
     "databaseUrlPreview": "postgresql://postgres...",
     "queryTimeMs": 50,
     "userTableExists": true,
     "timestamp": "2025-01-01T00:00:00.000Z"
   }
   ```

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → **Deployments**
   - Click on latest deployment
   - Check **Logs** tab for connection errors

3. **Monitor API Response Times:**
   - Check `/api/dashboard/stats` response time
   - Check `/api/news` response time
   - Should be < 500ms for healthy connections

---

## Step 5: Monitor Connection Health

### Health Check Endpoint

**URL:** `https://payaid-v3.vercel.app/api/health/db`

**What it checks:**
- ✅ DATABASE_URL is configured
- ✅ Database connection works
- ✅ Query execution time
- ✅ Table access

**Monitoring:**
- Set up uptime monitoring (e.g., UptimeRobot)
- Check endpoint every 5 minutes
- Alert if status is not "healthy"

### Vercel Logs

**What to watch for:**
- ❌ `P1001` - Connection timeout
- ❌ `P1002` - Pooler timeout
- ❌ `P1017` - Server closed connection
- ❌ `MaxClientsInSessionMode` - Pool exhaustion
- ⚠️ Query times > 1000ms

**How to check:**
1. Vercel Dashboard → Project → **Logs**
2. Filter by "error" or "database"
3. Look for Prisma error codes

### API Response Times

**Monitor these endpoints:**
- `/api/dashboard/stats` - Should be < 500ms
- `/api/news` - Should be < 500ms
- `/api/auth/me` - Should be < 300ms

**Tools:**
- Vercel Analytics (built-in)
- Browser DevTools Network tab
- External monitoring (e.g., Pingdom)

---

## ✅ Completion Checklist

- [ ] DATABASE_URL updated in Vercel (Session Pooler, port 5432)
- [ ] DATABASE_CONNECTION_LIMIT set to 10 (optional but recommended)
- [ ] Environment variables saved for Production and Preview
- [ ] Application redeployed after environment variable changes
- [ ] Health check endpoint verified: `/api/health/db`
- [ ] Local verification script passes: `npm run ts-node scripts/verify-database-connection-setup.ts`
- [ ] No connection errors in Vercel logs
- [ ] API response times are acceptable (< 500ms)

---

## 🧪 Testing Commands

### Test Health Check Locally
```bash
# Start dev server
npm run dev

# In another terminal
curl http://localhost:3000/api/health/db
```

### Test Health Check in Production
```bash
curl https://payaid-v3.vercel.app/api/health/db
```

### Verify Connection Setup
```bash
npm run ts-node scripts/verify-database-connection-setup.ts
```

### Check Environment Variables
```bash
npm run ts-node scripts/check-vercel-env.ts
```

---

## 📊 Expected Results

### Health Check Response (Healthy)
```json
{
  "status": "healthy",
  "hasDatabaseUrl": true,
  "databaseUrlPreview": "postgresql://postgres...",
  "queryTimeMs": 45,
  "userTableExists": true,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Verification Script Output (All Pass)
```
✅ DATABASE_URL Environment Variable
✅ Connection String Format
✅ Connection Pool Parameters
✅ DATABASE_CONNECTION_LIMIT
✅ Database Connection Test
✅ Table Access Test
✅ PostgreSQL Version

📊 Summary:
✅ Passed: 7
⚠️  Warnings: 0
❌ Failed: 0

✅ All checks passed! Database connection is properly configured.
```

---

## 🔧 Troubleshooting

### If Health Check Fails

1. **Check DATABASE_URL:**
   - Verify it's set in Vercel
   - Check format is correct
   - Ensure password is URL-encoded

2. **Check Supabase:**
   - Verify project is not paused
   - Check connection pooler is enabled
   - Verify credentials are correct

3. **Check Vercel Logs:**
   - Look for specific error messages
   - Check Prisma error codes
   - Review connection timeout errors

### If Connection Pool Exhaustion

1. **Reduce Connection Limit:**
   - Set `DATABASE_CONNECTION_LIMIT=5` (lower)
   - Redeploy

2. **Check Supabase Limits:**
   - Free tier: 60 connections max
   - Consider upgrading if needed

3. **Monitor Connection Usage:**
   - Check Supabase Dashboard → Database → Connection Pooler
   - Look for active connections

---

## 📝 Quick Reference

### Connection String Template
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public
```

### Environment Variables
```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public
DATABASE_CONNECTION_LIMIT=10
```

### Health Check URL
```
https://payaid-v3.vercel.app/api/health/db
```

---

**Status:** Ready to implement
**Estimated Time:** 15-20 minutes
**Priority:** High (Database Stability)

