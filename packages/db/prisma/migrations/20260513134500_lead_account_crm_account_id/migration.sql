-- Lead Intelligence M1: dedupe key for canonical accounts materialized from CRM Account index.
ALTER TABLE "LeadAccount" ADD COLUMN "crmAccountId" TEXT;

CREATE UNIQUE INDEX "LeadAccount_tenantId_crmAccountId_key" ON "LeadAccount"("tenantId", "crmAccountId");
