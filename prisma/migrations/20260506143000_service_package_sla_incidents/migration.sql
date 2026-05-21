-- Service packages, delivery SLA incidents, milestone/phase scaffolding, optional project→package link,
-- TimeEntry approvalStatus for utilization rollups. Idempotent for partial environments.

CREATE TABLE IF NOT EXISTS "ServicePackage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'RETAINER',
    "monthlyHours" DECIMAL(10,2),
    "sla" TEXT,
    "slaPolicy" JSONB,
    "renewalDate" TIMESTAMP(3),
    "overageRules" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ServicePackage" ADD COLUMN "slaPolicy" JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ServicePackage_tenantId_idx" ON "ServicePackage"("tenantId");
CREATE INDEX IF NOT EXISTS "ServicePackage_tenantId_clientId_idx" ON "ServicePackage"("tenantId", "clientId");
CREATE INDEX IF NOT EXISTS "ServicePackage_tenantId_status_idx" ON "ServicePackage"("tenantId", "status");

DO $$ BEGIN
  ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProjectPhase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectPhase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectPhase_projectId_idx" ON "ProjectPhase"("projectId");

DO $$ BEGIN
  ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseId" TEXT,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "billingDraftInvoiceId" TEXT,
    "billingTrigger" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectMilestone_projectId_dueDate_idx" ON "ProjectMilestone"("projectId", "dueDate");

DO $$ BEGIN
  ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_phaseId_fkey"
    FOREIGN KEY ("phaseId") REFERENCES "ProjectPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "servicePackageId" TEXT;

CREATE INDEX IF NOT EXISTS "Project_servicePackageId_idx" ON "Project"("servicePackageId");

DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_servicePackageId_fkey"
    FOREIGN KEY ("servicePackageId") REFERENCES "ServicePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ServiceSlaIncident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "servicePackageId" TEXT,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceSlaIncident_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceSlaIncident_tenantId_status_idx" ON "ServiceSlaIncident"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ServiceSlaIncident_tenantId_severity_status_idx" ON "ServiceSlaIncident"("tenantId", "severity", "status");
CREATE INDEX IF NOT EXISTS "ServiceSlaIncident_tenantId_servicePackageId_idx" ON "ServiceSlaIncident"("tenantId", "servicePackageId");
CREATE INDEX IF NOT EXISTS "ServiceSlaIncident_projectId_idx" ON "ServiceSlaIncident"("projectId");
CREATE INDEX IF NOT EXISTS "ServiceSlaIncident_tenantId_sourceType_sourceId_idx" ON "ServiceSlaIncident"("tenantId", "sourceType", "sourceId");

DO $$ BEGIN
  ALTER TABLE "ServiceSlaIncident" ADD CONSTRAINT "ServiceSlaIncident_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ServiceSlaIncident" ADD CONSTRAINT "ServiceSlaIncident_servicePackageId_fkey"
    FOREIGN KEY ("servicePackageId") REFERENCES "ServicePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ServiceSlaIncident" ADD CONSTRAINT "ServiceSlaIncident_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TimeEntry" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "TimeEntry_projectId_approvalStatus_idx" ON "TimeEntry"("projectId", "approvalStatus");
