-- Create specialist activity audit table (tenant-scoped) used by AI specialist governance.

CREATE TABLE IF NOT EXISTS "SpecialistActivityLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "specialistId" TEXT NOT NULL,
  "specialistName" TEXT NOT NULL,
  "specialistVersion" TEXT NOT NULL DEFAULT 'v1',
  "module" TEXT NOT NULL,
  "recordType" TEXT,
  "recordId" TEXT,
  "sessionId" TEXT NOT NULL,
  "intent" TEXT,
  "prompt" TEXT NOT NULL,
  "contextSources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "permissionsChecked" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "permissionResult" TEXT NOT NULL,
  "actionLevel" TEXT NOT NULL,
  "draftArtifactId" TEXT,
  "proposedAction" TEXT,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
  "approvalBy" TEXT,
  "result" TEXT NOT NULL,
  "errorCode" TEXT,
  "reason" TEXT,
  "latencyMs" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpecialistActivityLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SpecialistActivityLog_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_idx"
  ON "SpecialistActivityLog"("tenantId");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_specialistId_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "specialistId", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_module_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "module", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_actionLevel_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "actionLevel", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_result_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "result", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_permissionResult_createdAt_idx"
  ON "SpecialistActivityLog"("tenantId", "permissionResult", "createdAt");

CREATE INDEX IF NOT EXISTS "SpecialistActivityLog_tenantId_sessionId_idx"
  ON "SpecialistActivityLog"("tenantId", "sessionId");
