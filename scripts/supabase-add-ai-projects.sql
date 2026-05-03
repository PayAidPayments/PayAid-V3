-- Manual SQL for AI Projects (context memory) and conversation.projectId
-- Run this in Supabase SQL Editor if you're not using Prisma migrate, or if migrate fails.
-- Tables/columns match Prisma schema: AIProject, AICofounderConversation.projectId

-- 1. Create AIProject table
CREATE TABLE IF NOT EXISTS "AIProject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "instructions" TEXT,
  "contextNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Indexes for AIProject
CREATE INDEX IF NOT EXISTS "AIProject_tenantId_idx" ON "AIProject"("tenantId");
CREATE INDEX IF NOT EXISTS "AIProject_tenantId_userId_idx" ON "AIProject"("tenantId", "userId");

-- 3. Add projectId to AICofounderConversation (skip if column already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AICofounderConversation' AND column_name = 'projectId'
  ) THEN
    ALTER TABLE "AICofounderConversation" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

-- 4. Foreign key: conversation.projectId -> AIProject.id (ON DELETE SET NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AICofounderConversation_projectId_fkey'
  ) THEN
    ALTER TABLE "AICofounderConversation"
    ADD CONSTRAINT "AICofounderConversation_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "AIProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Index for AICofounderConversation.projectId
CREATE INDEX IF NOT EXISTS "AICofounderConversation_projectId_idx" ON "AICofounderConversation"("projectId");
