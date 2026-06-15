-- Lead Intelligence M1: per-source discovery execution records (operator + audit spine).
CREATE TYPE "LeadDiscoveryJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'PARTIAL', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "lead_discovery_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "segmentId" TEXT,
    "sourceName" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "LeadDiscoveryJobStatus" NOT NULL DEFAULT 'QUEUED',
    "rowsFound" INTEGER NOT NULL DEFAULT 0,
    "errorsJson" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_discovery_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_discovery_jobs_tenantId_status_createdAt_idx" ON "lead_discovery_jobs"("tenantId", "status", "createdAt");
CREATE INDEX "lead_discovery_jobs_tenantId_sourceName_createdAt_idx" ON "lead_discovery_jobs"("tenantId", "sourceName", "createdAt");
CREATE INDEX "lead_discovery_jobs_segmentId_idx" ON "lead_discovery_jobs"("segmentId");
CREATE INDEX "lead_discovery_jobs_tenantId_idempotencyKey_idx" ON "lead_discovery_jobs"("tenantId", "idempotencyKey");

ALTER TABLE "lead_discovery_jobs" ADD CONSTRAINT "lead_discovery_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_discovery_jobs" ADD CONSTRAINT "lead_discovery_jobs_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "LeadSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
