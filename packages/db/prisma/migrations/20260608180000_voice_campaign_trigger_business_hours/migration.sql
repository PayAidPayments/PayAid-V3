-- VoiceAgentCampaign: trigger_source + business_hours (Phase 3.2)
ALTER TABLE "VoiceAgentCampaign"
  ADD COLUMN IF NOT EXISTS "triggerSource" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "businessHoursJson" JSONB;
