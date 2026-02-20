-- Manual SQL Migration for Marketplace Reviews
-- Run this in Supabase SQL Editor if Prisma migrations fail
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- 1. Create MarketplaceAppReview table
CREATE TABLE IF NOT EXISTS "MarketplaceAppReview" (
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

-- 2. Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceAppReview_appId_fkey'
    ) THEN
        ALTER TABLE "MarketplaceAppReview" 
        ADD CONSTRAINT "MarketplaceAppReview_appId_fkey" 
        FOREIGN KEY ("appId") REFERENCES "MarketplaceApp"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceAppReview_installationId_fkey'
    ) THEN
        ALTER TABLE "MarketplaceAppReview" 
        ADD CONSTRAINT "MarketplaceAppReview_installationId_fkey" 
        FOREIGN KEY ("installationId") REFERENCES "MarketplaceAppInstallation"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceAppReview_tenantId_fkey'
    ) THEN
        ALTER TABLE "MarketplaceAppReview" 
        ADD CONSTRAINT "MarketplaceAppReview_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceAppReview_userId_fkey'
    ) THEN
        ALTER TABLE "MarketplaceAppReview" 
        ADD CONSTRAINT "MarketplaceAppReview_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Add unique constraint (one review per tenant per app)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceAppReview_appId_tenantId_key'
    ) THEN
        ALTER TABLE "MarketplaceAppReview" 
        ADD CONSTRAINT "MarketplaceAppReview_appId_tenantId_key" UNIQUE ("appId", "tenantId");
    END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS "MarketplaceAppReview_appId_idx" ON "MarketplaceAppReview"("appId");
CREATE INDEX IF NOT EXISTS "MarketplaceAppReview_appId_rating_idx" ON "MarketplaceAppReview"("appId", "rating");
CREATE INDEX IF NOT EXISTS "MarketplaceAppReview_createdAt_idx" ON "MarketplaceAppReview"("createdAt");

-- 5. Update MarketplaceApp table - Add new columns
DO $$ 
BEGIN
    -- Add developerId if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'developerId'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "developerId" TEXT;
    END IF;

    -- Add isApproved if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'isApproved'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add submittedAt if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'submittedAt'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "submittedAt" TIMESTAMP(3);
    END IF;

    -- Add approvedAt if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'approvedAt'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "approvedAt" TIMESTAMP(3);
    END IF;

    -- Add version if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'version'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "version" TEXT DEFAULT '1.0.0';
    END IF;

    -- Add changelog if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MarketplaceApp' AND column_name = 'changelog'
    ) THEN
        ALTER TABLE "MarketplaceApp" ADD COLUMN "changelog" TEXT;
    END IF;
END $$;

-- 6. Create indexes on MarketplaceApp
CREATE INDEX IF NOT EXISTS "MarketplaceApp_isApproved_idx" ON "MarketplaceApp"("isApproved");
CREATE INDEX IF NOT EXISTS "MarketplaceApp_developerId_idx" ON "MarketplaceApp"("developerId");

-- 7. Verify tables were created
SELECT 
    'MarketplaceAppReview' as table_name,
    COUNT(*) as row_count
FROM "MarketplaceAppReview"
UNION ALL
SELECT 
    'MarketplaceApp' as table_name,
    COUNT(*) as row_count
FROM "MarketplaceApp";

-- Success message
SELECT 'Migration completed successfully! MarketplaceAppReview table created and MarketplaceApp updated.' as status;
