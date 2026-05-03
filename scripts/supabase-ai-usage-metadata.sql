-- Add metadata column to AIUsage for richer audit (agentId, hasArtifact, actionCount)
-- Run in Supabase SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AIUsage' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE "AIUsage" ADD COLUMN "metadata" JSONB;
  END IF;
END $$;
