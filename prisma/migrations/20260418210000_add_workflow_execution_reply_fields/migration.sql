-- Align DB with Prisma WorkflowExecution reply tracking (sequence enrollment).
-- Idempotent: safe if a column already exists (manual hotfix / re-run).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkflowExecution' AND column_name = 'replyStatus'
  ) THEN
    ALTER TABLE "WorkflowExecution" ADD COLUMN "replyStatus" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkflowExecution' AND column_name = 'repliedAt'
  ) THEN
    ALTER TABLE "WorkflowExecution" ADD COLUMN "repliedAt" TIMESTAMP(3);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "WorkflowExecution_tenantId_replyStatus_idx" ON "WorkflowExecution"("tenantId", "replyStatus");
