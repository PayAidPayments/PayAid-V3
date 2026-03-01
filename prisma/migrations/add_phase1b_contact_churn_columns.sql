-- Phase 1B: Contact churn columns (add if missing - fixes "Contact.churnRiskScore does not exist")
-- Run manually if needed: psql $DATABASE_URL -f prisma/migrations/add_phase1b_contact_churn_columns.sql
-- Otherwise: npx prisma migrate deploy (runs 20250226120000_add_contact_churn_phase1b)

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnRiskScore" DOUBLE PRECISION;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnReasonSummary" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "churnRiskUpdatedAt" TIMESTAMP(3);
