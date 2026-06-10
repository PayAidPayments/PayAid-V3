-- Backfill vector-specific LogoVariation columns for environments
-- where vector logo schema rollout was partially applied.
ALTER TABLE "LogoVariation"
ADD COLUMN IF NOT EXISTS "svgData" TEXT,
ADD COLUMN IF NOT EXISTS "fontFamily" TEXT,
ADD COLUMN IF NOT EXISTS "fontSize" INTEGER,
ADD COLUMN IF NOT EXISTS "textColor" TEXT,
ADD COLUMN IF NOT EXISTS "gradient" JSONB,
ADD COLUMN IF NOT EXISTS "shadow" JSONB,
ADD COLUMN IF NOT EXISTS "outline" JSONB,
ADD COLUMN IF NOT EXISTS "animation" TEXT,
ADD COLUMN IF NOT EXISTS "background" JSONB,
ADD COLUMN IF NOT EXISTS "layout" JSONB,
ADD COLUMN IF NOT EXISTS "layoutConfig" JSONB,
ADD COLUMN IF NOT EXISTS "size" INTEGER;
