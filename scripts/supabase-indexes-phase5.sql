-- Phase 5: Supabase indexes for Teja to run (optional; Prisma schema may already create some).
-- Run in Supabase SQL Editor. Uses IF NOT EXISTS for idempotency.
-- These support batched queries (in:ids + groupBy) and dashboard list filters.

-- Interaction: batch health-scores / activity feed by contactId + time
CREATE INDEX IF NOT EXISTS "idx_interaction_contact_created"
  ON "Interaction" ("contactId", "createdAt" DESC);

-- Interaction: filter by type (support, email) in batch
CREATE INDEX IF NOT EXISTS "idx_interaction_contact_type_created"
  ON "Interaction" ("contactId", "type", "createdAt" DESC);

-- Invoice: batch by customer for health-scores
CREATE INDEX IF NOT EXISTS "idx_invoice_customer_tenant"
  ON "Invoice" ("customerId", "tenantId");

-- Task: dashboard tasks-view (tenant + status + dueDate already in schema; ensure composite)
CREATE INDEX IF NOT EXISTS "idx_task_tenant_due_status"
  ON "Task" ("tenantId", "dueDate", "status")
  WHERE "dueDate" IS NOT NULL;

-- Contact: list by tenant + limit (covering for id-only fetch)
CREATE INDEX IF NOT EXISTS "idx_contact_tenant_id_only"
  ON "Contact" ("tenantId")
  WHERE "tenantId" IS NOT NULL;

-- Deal: activity feed / dashboard by tenant + updated
CREATE INDEX IF NOT EXISTS "idx_deal_tenant_updated"
  ON "Deal" ("tenantId", "updatedAt" DESC);

-- Optional: Segment contact count (if Segment table exists and criteria-based count is slow)
-- CREATE INDEX IF NOT EXISTS "idx_segment_tenant_created"
--   ON "Segment" ("tenantId", "createdAt" DESC);
