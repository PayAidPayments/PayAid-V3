-- Add contextNotes to AIProject (optional context upload: paste data/notes)
-- Run in Supabase SQL Editor if AIProject already exists without this column.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AIProject' AND column_name = 'contextNotes'
  ) THEN
    ALTER TABLE "AIProject" ADD COLUMN "contextNotes" TEXT;
  END IF;
END $$;
