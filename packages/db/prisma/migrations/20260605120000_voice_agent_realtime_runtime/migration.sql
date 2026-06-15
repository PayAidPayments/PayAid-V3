-- Bolna real-time runtime columns (VoiceAgent + VoiceAgentCall KPIs).
-- Idempotent for staging DBs that may partially apply.

ALTER TABLE "VoiceAgent" ADD COLUMN IF NOT EXISTS "voiceRuntime" TEXT NOT NULL DEFAULT 'native';
ALTER TABLE "VoiceAgent" ADD COLUMN IF NOT EXISTS "bolnaAgentId" TEXT;
ALTER TABLE "VoiceAgent" ADD COLUMN IF NOT EXISTS "runtimeSyncedAt" TIMESTAMP(3);

ALTER TABLE "VoiceAgentCall" ADD COLUMN IF NOT EXISTS "runtime" TEXT;
ALTER TABLE "VoiceAgentCall" ADD COLUMN IF NOT EXISTS "firstAudioMs" INTEGER;
ALTER TABLE "VoiceAgentCall" ADD COLUMN IF NOT EXISTS "bargeInCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "VoiceAgentCall" ADD COLUMN IF NOT EXISTS "interruptedTokens" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "VoiceAgent_tenantId_voiceRuntime_idx" ON "VoiceAgent"("tenantId", "voiceRuntime");
CREATE INDEX IF NOT EXISTS "VoiceAgentCall_tenantId_runtime_idx" ON "VoiceAgentCall"("tenantId", "runtime");
