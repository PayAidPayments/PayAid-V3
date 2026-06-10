-- Lead Intelligence M1: dedupe key for canonical contacts from CRM Contact index.
ALTER TABLE "LeadContact" ADD COLUMN "crmContactId" TEXT;

CREATE UNIQUE INDEX "LeadContact_tenantId_crmContactId_key" ON "LeadContact"("tenantId", "crmContactId");
