-- VoiceCrmLink table + CallMessage.interruptedFlag (blueprint §CRM schema)
ALTER TABLE "CallMessage"
  ADD COLUMN IF NOT EXISTS "interruptedFlag" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "VoiceCrmLink" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "voiceSessionId" TEXT,
  "voiceCallId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "matchConfidence" DOUBLE PRECISION DEFAULT 1,
  "createMode" TEXT NOT NULL,
  "syncStatus" TEXT NOT NULL DEFAULT 'linked',
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoiceCrmLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VoiceCrmLink_tenantId_idx" ON "VoiceCrmLink"("tenantId");
CREATE INDEX IF NOT EXISTS "VoiceCrmLink_tenantId_voiceSessionId_idx" ON "VoiceCrmLink"("tenantId", "voiceSessionId");
CREATE INDEX IF NOT EXISTS "VoiceCrmLink_tenantId_voiceCallId_idx" ON "VoiceCrmLink"("tenantId", "voiceCallId");
CREATE INDEX IF NOT EXISTS "VoiceCrmLink_tenantId_entityType_entityId_idx" ON "VoiceCrmLink"("tenantId", "entityType", "entityId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceCrmLink_tenantId_fkey'
  ) THEN
    ALTER TABLE "VoiceCrmLink"
      ADD CONSTRAINT "VoiceCrmLink_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
