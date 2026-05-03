-- Backfill/repair Logo.logoType for environments where vector logo migration was skipped.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogoType') THEN
    CREATE TYPE "LogoType" AS ENUM ('VECTOR', 'AI_IMAGE');
  END IF;
END $$;

ALTER TABLE "Logo"
ADD COLUMN IF NOT EXISTS "logoType" "LogoType" NOT NULL DEFAULT 'VECTOR';

CREATE INDEX IF NOT EXISTS "Logo_tenantId_logoType_idx"
ON "Logo" ("tenantId", "logoType");
