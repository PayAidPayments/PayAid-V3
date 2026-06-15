-- Voice tenant compliance policy + durable VoiceEvent table (blueprint Phase 3)

CREATE TABLE IF NOT EXISTS "VoiceTenantCompliancePolicy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "recordingRequired" BOOLEAN NOT NULL DEFAULT true,
  "transcriptRequired" BOOLEAN NOT NULL DEFAULT true,
  "consentMode" TEXT NOT NULL DEFAULT 'explicit_toggle',
  "retentionDays" INTEGER NOT NULL DEFAULT 90,
  "redactExportsByDefault" BOOLEAN NOT NULL DEFAULT true,
  "outboundDisclosureText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoiceTenantCompliancePolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VoiceTenantCompliancePolicy_tenantId_key"
  ON "VoiceTenantCompliancePolicy"("tenantId");
CREATE INDEX IF NOT EXISTS "VoiceTenantCompliancePolicy_tenantId_idx"
  ON "VoiceTenantCompliancePolicy"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceTenantCompliancePolicy_tenantId_fkey'
  ) THEN
    ALTER TABLE "VoiceTenantCompliancePolicy"
      ADD CONSTRAINT "VoiceTenantCompliancePolicy_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "VoiceEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "agentId" TEXT,
  "sessionId" TEXT,
  "callId" TEXT,
  "metaJson" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoiceEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VoiceEvent_tenantId_occurredAt_idx" ON "VoiceEvent"("tenantId", "occurredAt");
CREATE INDEX IF NOT EXISTS "VoiceEvent_tenantId_event_idx" ON "VoiceEvent"("tenantId", "event");
CREATE INDEX IF NOT EXISTS "VoiceEvent_tenantId_sessionId_idx" ON "VoiceEvent"("tenantId", "sessionId");
CREATE INDEX IF NOT EXISTS "VoiceEvent_tenantId_callId_idx" ON "VoiceEvent"("tenantId", "callId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceEvent_tenantId_fkey'
  ) THEN
    ALTER TABLE "VoiceEvent"
      ADD CONSTRAINT "VoiceEvent_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
