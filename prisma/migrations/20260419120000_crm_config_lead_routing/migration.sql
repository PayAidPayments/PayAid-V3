-- Lead routing configuration JSON on CRMConfig

ALTER TABLE "CRMConfig" ADD COLUMN IF NOT EXISTS "leadRouting" JSONB;
