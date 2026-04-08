-- PayAid V3: Profile top CRM/dashboard queries with EXPLAIN ANALYZE.
-- Run in Supabase SQL Editor or psql. Add indexes for any Seq Scan or high "actual time".
-- Replace YOUR_TENANT_ID with a real tenant CUID (e.g. from SELECT id FROM "Tenant" LIMIT 1).

-- 1) CRM dashboard: deals count (open)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM "Deal"
WHERE "tenantId" = 'YOUR_TENANT_ID' AND "stage" NOT IN ('won', 'lost');

-- 2) CRM dashboard: pipeline value
EXPLAIN (ANALYZE, BUFFERS)
SELECT COALESCE(SUM("value"), 0) FROM "Deal"
WHERE "tenantId" = 'YOUR_TENANT_ID' AND "stage" NOT IN ('won', 'lost');

-- 3) Contacts count
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM "Contact" WHERE "tenantId" = 'YOUR_TENANT_ID';

-- 4) Tasks due today (pending)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM "Task"
WHERE "tenantId" = 'YOUR_TENANT_ID' AND "status" = 'pending'
  AND "dueDate" >= date_trunc('day', now())
  AND "dueDate" <= now();

-- 5) Home summary: invoices pending + overdue
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), COALESCE(SUM("total"), 0) FROM "Invoice"
WHERE "tenantId" = 'YOUR_TENANT_ID' AND "status" IN ('sent', 'issued');

-- Recommended indexes (create if EXPLAIN shows Seq Scan and table is large):
-- CREATE INDEX IF NOT EXISTS idx_deal_tenant_stage ON "Deal" ("tenantId", "stage");
-- CREATE INDEX IF NOT EXISTS idx_contact_tenant ON "Contact" ("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_task_tenant_status_due ON "Task" ("tenantId", "status", "dueDate");
-- CREATE INDEX IF NOT EXISTS idx_invoice_tenant_status ON "Invoice" ("tenantId", "status");
