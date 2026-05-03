-- Inbound lead orchestration execution trace (CRM Automation → Execution logs)

CREATE TABLE "InboundOrchestrationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" TEXT NOT NULL,
    "sourceChannel" TEXT NOT NULL,
    "dedupeAction" TEXT,
    "leadScore" DOUBLE PRECISION,
    "contactCreated" BOOLEAN NOT NULL DEFAULT false,
    "trace" JSONB NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundOrchestrationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InboundOrchestrationLog_tenantId_createdAt_idx" ON "InboundOrchestrationLog"("tenantId", "createdAt" DESC);
CREATE INDEX "InboundOrchestrationLog_tenantId_sourceChannel_idx" ON "InboundOrchestrationLog"("tenantId", "sourceChannel");
CREATE INDEX "InboundOrchestrationLog_contactId_idx" ON "InboundOrchestrationLog"("contactId");

ALTER TABLE "InboundOrchestrationLog" ADD CONSTRAINT "InboundOrchestrationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InboundOrchestrationLog" ADD CONSTRAINT "InboundOrchestrationLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
