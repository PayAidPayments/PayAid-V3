-- Faster CRM deal list: WHERE "tenantId" = ? ORDER BY "createdAt" DESC
CREATE INDEX IF NOT EXISTS "idx_deal_tenant_created_desc" ON "Deal" ("tenantId", "createdAt" DESC);
