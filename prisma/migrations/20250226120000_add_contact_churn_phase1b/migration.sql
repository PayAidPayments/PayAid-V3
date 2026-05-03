-- Phase 1B: Contact churn risk columns (required for Prisma schema; add if not present)
-- Run via: npx prisma migrate deploy
-- Or manually: psql $DATABASE_URL -f prisma/migrations/20250226120000_add_contact_churn_phase1b/migration.sql

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnRiskScore" DOUBLE PRECISION;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnReasonSummary" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnRiskUpdatedAt" TIMESTAMP(3);

COMMENT ON COLUMN "Contact"."churnRiskScore" IS 'Phase 1B: 0-100 churn risk score';
COMMENT ON COLUMN "Contact"."churnReasonSummary" IS 'Phase 1B: AI summary of churn reasons';
COMMENT ON COLUMN "Contact"."churnRiskUpdatedAt" IS 'Phase 1B: When churn score was last updated';
