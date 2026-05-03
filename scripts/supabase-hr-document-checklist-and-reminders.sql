-- =============================================================================
-- PayAid V3 – Supabase (PostgreSQL) – HR document checklist & proactive reminders
-- Run this manually in Supabase SQL Editor if you want DB-backed config.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- =============================================================================

-- 1) Document types / checklist config (for Employee document checklist & vault)
--    Drives which document types are “expected” per employee and shown in the checklist.
--    If you prefer app-only config, you can skip this and use a constant list in code.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_document_types (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT NOT NULL,
  code         TEXT NOT NULL,
  label        TEXT NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder"  INT NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("tenantId", code)
);

CREATE INDEX IF NOT EXISTS idx_hr_document_types_tenant
  ON hr_document_types("tenantId");

COMMENT ON TABLE hr_document_types IS 'Expected document types per tenant for employee document checklist (v1 vault)';

-- Optional: add FK to Tenant if your table is named "Tenant" (Prisma default)
-- ALTER TABLE hr_document_types
--   ADD CONSTRAINT fk_hr_document_types_tenant
--   FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE;
-- If your tenant table is lowercase:
--   FOREIGN KEY ("tenantId") REFERENCES tenant(id) ON DELETE CASCADE;

-- Seed default document types for a tenant (run once per tenant; replace <TENANT_ID> with real id)
-- INSERT INTO hr_document_types ("tenantId", code, label, "isRequired", "sortOrder")
-- VALUES
--   ('<TENANT_ID>', 'OFFER_LETTER',    'Offer letter',       true,  1),
--   ('<TENANT_ID>', 'PAN',             'PAN card',           true,  2),
--   ('<TENANT_ID>', 'AADHAAR',         'Aadhaar',            true,  3),
--   ('<TENANT_ID>', 'BANK_PROOF',      'Bank account proof', true,  4),
--   ('<TENANT_ID>', 'FORM_16',         'Form 16',            false, 5),
--   ('<TENANT_ID>', 'EXPERIENCE_LETTER','Experience letter', false, 6)
-- ON CONFLICT ("tenantId", code) DO NOTHING;


-- 2) Proactive HR reminders (probation, reviews, contract expiry)
--    Used by the “Proactive reminders” feature (probation, reviews, contracts).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_reminders (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT NOT NULL,
  type         TEXT NOT NULL,  -- e.g. PROBATION_END, REVIEW_DUE, CONTRACT_EXPIRY, PIP_DEADLINE
  "entityType" TEXT NOT NULL,  -- e.g. Employee, Contract, RetentionIntervention
  "entityId"   TEXT NOT NULL,
  "dueDate"    DATE NOT NULL,
  title        TEXT,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, SENT, DISMISSED, COMPLETED
  "notifiedAt" TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_reminders_tenant
  ON hr_reminders("tenantId");
CREATE INDEX IF NOT EXISTS idx_hr_reminders_tenant_type
  ON hr_reminders("tenantId", type);
CREATE INDEX IF NOT EXISTS idx_hr_reminders_due
  ON hr_reminders("dueDate") WHERE status = 'PENDING';

COMMENT ON TABLE hr_reminders IS 'Proactive reminders for probation, reviews, contract expiry (PayAid V3 HR)';


-- 3) Optional: Performance calibration sessions (for Calibration + PIP feature)
--    Stores calibration meeting metadata; PIP can continue to use RetentionIntervention.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_calibration_sessions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT NOT NULL,
  "cycleName"  TEXT NOT NULL,   -- e.g. Q1 2026
  "sessionDate" DATE,
  notes        TEXT,
  "createdById" TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_calibration_sessions_tenant
  ON hr_calibration_sessions("tenantId");

COMMENT ON TABLE hr_calibration_sessions IS 'Performance calibration meeting sessions (optional; PIP uses RetentionIntervention)';


-- 4) Optional: Index to speed up audit log filters (payroll & contract changes)
--    Only if you query AuditLog by entityType often.
-- -----------------------------------------------------------------------------
-- Ensure index exists for entityType (Prisma may already create one)
-- CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_entity_type
--   ON "AuditLog"("tenantId", "entityType");
-- Use "AuditLog" if your table name is PascalCase; otherwise "audit_log" or audit_log.


-- =============================================================================
-- Summary
-- =============================================================================
-- Tables created (if not exist):
--   hr_document_types     – Document checklist config per tenant (codes, labels, required)
--   hr_reminders         – Proactive reminders (probation, reviews, contracts)
--   hr_calibration_sessions – Optional calibration meeting notes
--
-- Next steps:
-- 1. Replace <TENANT_ID> in the seed block and run the INSERT for hr_document_types if desired.
-- 2. Add these tables to Prisma schema and run `npx prisma generate` if you want ORM access.
-- 3. Or use raw SQL / Supabase client in the app to read/write these tables.
