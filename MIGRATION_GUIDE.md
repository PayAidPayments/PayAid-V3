# Database Migration Guide

## Issue: Database Connection Error

The migration failed with: `FATAL: Tenant or user not found`

This indicates a database connection/authentication issue.

---

## Solutions

### Option 1: Check Database URL

Verify your `.env` file has the correct `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

For Supabase, it should look like:
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

### Option 2: Use Local Database

If you want to use a local PostgreSQL database:

1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE payaid_v3;
   ```
3. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/payaid_v3?schema=public"
   ```

### Option 3: Verify Supabase Connection

If using Supabase:
1. Go to your Supabase project dashboard
2. Check the connection string in Settings → Database
3. Ensure the password is correct
4. Verify the database is accessible

---

## After Fixing Connection

Once the database connection is working, run:

```bash
npx prisma migrate dev --name add_marketplace_reviews
```

Or use `db push` for development:

```bash
npx prisma db push
```

---

## What the Migration Will Create

1. **MarketplaceAppReview** table with fields:
   - id, appId, installationId, tenantId, userId
   - rating, title, comment
   - isVerified, helpfulCount
   - createdAt, updatedAt

2. **Updates to MarketplaceApp** table:
   - developerId field
   - isApproved field
   - submittedAt, approvedAt fields
   - version, changelog fields

---

## Verify Migration Success

After successful migration:

```bash
# Check tables exist
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<< "SELECT * FROM \"MarketplaceAppReview\" LIMIT 1;"
```

---

## Alternative: Manual SQL (if migration fails)

If migrations continue to fail, you can run the SQL manually:

```sql
-- Create MarketplaceAppReview table
CREATE TABLE "MarketplaceAppReview" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "installationId" TEXT,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceAppReview_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "MarketplaceAppReview" ADD CONSTRAINT "MarketplaceAppReview_appId_fkey" FOREIGN KEY ("appId") REFERENCES "MarketplaceApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceAppReview" ADD CONSTRAINT "MarketplaceAppReview_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "MarketplaceAppInstallation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceAppReview" ADD CONSTRAINT "MarketplaceAppReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceAppReview" ADD CONSTRAINT "MarketplaceAppReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint
CREATE UNIQUE INDEX "MarketplaceAppReview_appId_tenantId_key" ON "MarketplaceAppReview"("appId", "tenantId");

-- Add indexes
CREATE INDEX "MarketplaceAppReview_appId_idx" ON "MarketplaceAppReview"("appId");
CREATE INDEX "MarketplaceAppReview_appId_rating_idx" ON "MarketplaceAppReview"("appId", "rating");
CREATE INDEX "MarketplaceAppReview_createdAt_idx" ON "MarketplaceAppReview"("createdAt");

-- Update MarketplaceApp table
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "developerId" TEXT;
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "version" TEXT DEFAULT '1.0.0';
ALTER TABLE "MarketplaceApp" ADD COLUMN IF NOT EXISTS "changelog" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "MarketplaceApp_isApproved_idx" ON "MarketplaceApp"("isApproved");
CREATE INDEX IF NOT EXISTS "MarketplaceApp_developerId_idx" ON "MarketplaceApp"("developerId");
```

---

## Status

**Code:** ✅ All features implemented  
**Database:** ⚠️ Migration pending (connection issue)  
**Next Step:** Fix database connection and run migration
