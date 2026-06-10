-- Browser demo v1: training pack, demo sessions, published training version pointer.
ALTER TABLE "VoiceAgent" ADD COLUMN "publishedTrainingPackVersion" INTEGER;

CREATE TABLE "VoiceAgentTrainingPack" (
    "id" TEXT NOT NULL,
    "voiceAgentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "draftJson" JSONB NOT NULL DEFAULT '{}',
    "approvedJson" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAgentTrainingPack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceAgentTrainingPack_voiceAgentId_key" ON "VoiceAgentTrainingPack"("voiceAgentId");
CREATE INDEX "VoiceAgentTrainingPack_tenantId_idx" ON "VoiceAgentTrainingPack"("tenantId");
CREATE INDEX "VoiceAgentTrainingPack_tenantId_voiceAgentId_idx" ON "VoiceAgentTrainingPack"("tenantId", "voiceAgentId");

ALTER TABLE "VoiceAgentTrainingPack" ADD CONSTRAINT "VoiceAgentTrainingPack_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceAgentTrainingPack" ADD CONSTRAINT "VoiceAgentTrainingPack_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VoiceDemoSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "voiceAgentId" TEXT NOT NULL,
    "trainingPackVersionAtStart" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'browser',
    "status" TEXT NOT NULL DEFAULT 'active',
    "transcriptJson" JSONB NOT NULL DEFAULT '[]',
    "outcomeCode" TEXT,
    "metadataJson" JSONB,
    "qaFlagsJson" JSONB,
    "qaChecklistJson" JSONB,
    "qaSubmittedAt" TIMESTAMP(3),
    "qaSubmittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "VoiceDemoSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VoiceDemoSession_tenantId_idx" ON "VoiceDemoSession"("tenantId");
CREATE INDEX "VoiceDemoSession_voiceAgentId_idx" ON "VoiceDemoSession"("voiceAgentId");
CREATE INDEX "VoiceDemoSession_tenantId_createdAt_idx" ON "VoiceDemoSession"("tenantId", "createdAt");

ALTER TABLE "VoiceDemoSession" ADD CONSTRAINT "VoiceDemoSession_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceDemoSession" ADD CONSTRAINT "VoiceDemoSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
