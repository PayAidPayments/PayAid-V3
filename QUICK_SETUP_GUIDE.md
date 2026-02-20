# Quick Setup Guide - Manual Database Migration

## Current Status
- ✅ **All code files created** (50+ files)
- ✅ **Prisma schema updated**
- ⚠️ **Database migration pending** (connection issue)

## Solution: Manual SQL Migration

Since Prisma migrations are failing due to connection issues, you can run the SQL manually:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the SQL
1. Open `MANUAL_SQL_MIGRATION.sql` file
2. Copy all the SQL
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success
After running, you should see:
- ✅ "Migration completed successfully!" message
- ✅ `MarketplaceAppReview` table created
- ✅ `MarketplaceApp` table updated with new columns

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Test Features
Visit these URLs:
- `http://localhost:3000/dashboard/marketplace`
- `http://localhost:3000/dashboard/developer/portal`
- `http://localhost:3000/dashboard/analytics/ai-query`

---

## Alternative: Fix Connection String

If you want to use Prisma migrations instead:

1. **Get exact connection string from Supabase:**
   - Dashboard → Settings → Database
   - Copy **Session Pooler** connection string
   - Make sure it includes `pgbouncer=true`

2. **Update `.env`:**
   ```bash
   DATABASE_URL="[PASTE EXACT CONNECTION STRING FROM SUPABASE]?pgbouncer=true&schema=public"
   ```

3. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_marketplace_reviews
   ```

---

## What Gets Created

### MarketplaceAppReview Table
- Stores app reviews and ratings
- Links to MarketplaceApp, Tenant, User
- Supports verified purchases

### MarketplaceApp Updates
- `developerId` - Links to developer
- `isApproved` - Approval status
- `submittedAt`, `approvedAt` - Timestamps
- `version`, `changelog` - Version info

---

## After Migration

All features will be fully functional:
- ✅ Marketplace with reviews
- ✅ Developer Portal
- ✅ App submission workflow
- ✅ All other features ready

**Status: Ready to use after SQL migration! 🚀**
