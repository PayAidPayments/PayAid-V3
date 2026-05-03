-- CRM Sales Automation: persisted outreach programs (distinct from marketing Campaign).

CREATE TABLE "OutreachAutomation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetCriteria" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prospectsCount" INTEGER NOT NULL DEFAULT 0,
    "contactedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachAutomation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutreachAutomation_tenantId_idx" ON "OutreachAutomation"("tenantId");
CREATE INDEX "OutreachAutomation_tenantId_status_idx" ON "OutreachAutomation"("tenantId", "status");
CREATE INDEX "OutreachAutomation_tenantId_createdAt_idx" ON "OutreachAutomation"("tenantId", "createdAt");

ALTER TABLE "OutreachAutomation" ADD CONSTRAINT "OutreachAutomation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
