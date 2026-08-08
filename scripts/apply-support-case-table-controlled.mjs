/**
 * Controlled-reconcile: apply SupportCase DDL only (idempotent).
 * Does NOT run prisma migrate deploy / does NOT apply the other 10 never-applied pkg migrations.
 *
 * Source: packages/db/prisma/migrations/20260720160000_p1_a6_support_voice_graph/migration.sql
 * Scope: SupportCase table + indexes + FKs only (VoiceCrmLink graph columns deferred).
 *
 * Run: node scripts/apply-support-case-table-controlled.mjs
 */
import dotenv from 'dotenv'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const out = {
  ok: false,
  timestamp: iso,
  scope: 'supportcase-table-only-controlled-reconcile',
  gates: {
    migrations: 'controlled-reconcile-only',
    note: 'Does not deploy the other never-applied pkg-only migrations',
  },
  steps: {},
}

const sql = `
CREATE TABLE IF NOT EXISTS "SupportCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "contactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "channel" TEXT NOT NULL DEFAULT 'web',
    "assignedToId" TEXT,
    "voiceCallId" TEXT,
    "voiceSessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupportCase_tenantId_ticketNumber_key" ON "SupportCase"("tenantId", "ticketNumber");
CREATE INDEX IF NOT EXISTS "SupportCase_tenantId_idx" ON "SupportCase"("tenantId");
CREATE INDEX IF NOT EXISTS "SupportCase_tenantId_status_idx" ON "SupportCase"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "SupportCase_contactId_idx" ON "SupportCase"("contactId");
CREATE INDEX IF NOT EXISTS "SupportCase_voiceCallId_idx" ON "SupportCase"("voiceCallId");

DO $$ BEGIN
  ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`

if (!process.env.DATABASE_URL) {
  out.error = 'DATABASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
  statement_timeout: 60000,
})

try {
  await client.connect()
  out.steps.connect = { ok: true }

  const before = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'SupportCase'
    ) AS exists
  `)
  out.steps.before = { exists: !!before.rows[0]?.exists }

  await client.query(sql)
  out.steps.apply = { ok: true }

  const after = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'SupportCase'
    ) AS exists
  `)
  out.steps.after = { exists: !!after.rows[0]?.exists }
  if (!out.steps.after.exists) throw new Error('SupportCase still missing after apply')

  // Record as resolved in _prisma_migrations only if not already present — optional baseline.
  // Prefer NOT claiming the full p1_a6 migration (VoiceCrmLink cols deferred).
  out.steps.prismaMigrationRow = {
    recorded: false,
    reason: 'Partial apply only (SupportCase); full 20260720160000_p1_a6_support_voice_graph not marked applied',
  }

  out.ok = true
} catch (err) {
  out.error = String(err?.message || err)
} finally {
  try {
    await client.end()
  } catch {
    // ignore
  }
}

const dir = path.join(process.cwd(), 'docs/evidence/support')
mkdirSync(dir, { recursive: true })
const evidencePath = path.join(dir, `${stamp}-supportcase-table-controlled-reconcile.md`)
writeFileSync(
  evidencePath,
  `# SupportCase table — controlled reconcile\n\n- timestamp: ${iso}\n- ok: ${out.ok}\n- scope: SupportCase DDL only (not full pkg migrate deploy)\n\n\`\`\`json\n${JSON.stringify(out, null, 2)}\n\`\`\`\n`
)
out.evidencePath = evidencePath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
