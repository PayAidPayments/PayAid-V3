-- =============================================================================
-- PayAid V3: Add status & expiry to EmployeeDocument (run manually in Supabase SQL Editor)
-- =============================================================================
-- Use: Run once. Adds columns for document verification status and expiry alerts
--      (e.g. "PAN expires in 90 days"). Safe to run if columns already exist.
-- =============================================================================

-- Add status: PENDING | VERIFIED | REJECTED
ALTER TABLE "EmployeeDocument"
ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';

-- Add expiry date for alerts (e.g. PAN, passport)
ALTER TABLE "EmployeeDocument"
ADD COLUMN IF NOT EXISTS "expiryDate" timestamptz;

-- Optional: backfill existing rows
-- UPDATE "EmployeeDocument" SET status = 'PENDING' WHERE status IS NULL;
-- (IF NOT EXISTS makes the column exist with default, so no backfill needed for new column)
