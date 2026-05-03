-- =============================================================================
-- PayAid V3 – Supabase – Voice Agents (VEXYL-TTS support)
-- Run this manually in Supabase SQL Editor if you use Supabase for voice agents.
-- Ensures voice_tone (VEXYL style) and language column length for 22 Indian langs.
-- Safe to run multiple times (uses IF EXISTS / ADD COLUMN IF NOT EXISTS).
--
-- To check your existing schema first, run in SQL Editor:
--   SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name IN ('voice_agents', 'VoiceAgent')
--   ORDER BY table_name, ordinal_position;
-- =============================================================================

-- Option A: Table name is voice_agents (snake_case)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voice_agents') THEN
    ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS voice_tone TEXT;
    ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS workflow JSONB;
    COMMENT ON COLUMN voice_agents.voice_tone IS 'VEXYL voice style: calm | warm | formal';
    COMMENT ON COLUMN voice_agents.workflow IS 'Agent Builder flow: { nodes, edges }';
    ALTER TABLE voice_agents ALTER COLUMN language TYPE VARCHAR(10);
  END IF;
END $$;

-- Option B: If your table is "VoiceAgent" (PascalCase from Prisma)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'VoiceAgent') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'VoiceAgent' AND column_name = 'voiceTone'
    ) THEN
      ALTER TABLE "VoiceAgent" ADD COLUMN IF NOT EXISTS "voiceTone" TEXT;
    END IF;
    ALTER TABLE "VoiceAgent" ADD COLUMN IF NOT EXISTS workflow JSONB;
    ALTER TABLE "VoiceAgent" ALTER COLUMN language TYPE VARCHAR(10);
  END IF;
END $$;

-- Optional: RLS policies for voice_agents (uncomment if you use RLS)
-- ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Tenant isolation" ON voice_agents
--   FOR ALL USING ("tenantId" = current_setting('app.tenant_id', true));
