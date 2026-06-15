#!/usr/bin/env node
/**
 * Apply voice-only SQL migrations when `prisma migrate deploy` is blocked (P3009).
 * Uses pg directly — idempotent IF NOT EXISTS in migration files.
 */
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const dbDir = path.join(root, 'packages', 'db')
const migrations = [
  '20260605120000_voice_agent_realtime_runtime',
  '20260608180000_voice_campaign_trigger_business_hours',
  '20260608210000_voice_crm_link_interrupted_flag',
  '20260610120000_voice_compliance_policy_and_events',
]

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error(JSON.stringify({ ok: false, error: 'DATABASE_URL missing' }))
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
const results = []

try {
  await client.connect()
  for (const name of migrations) {
    const file = path.join(dbDir, 'prisma', 'migrations', name, 'migration.sql')
    if (!fs.existsSync(file)) {
      results.push({ name, ok: false, error: 'missing file' })
      continue
    }
    const sql = fs.readFileSync(file, 'utf8')
    try {
      await client.query(sql)
      results.push({ name, ok: true })
    } catch (error) {
      results.push({
        name,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
} finally {
  await client.end().catch(() => {})
}

const ok = results.every((r) => r.ok)
console.log(JSON.stringify({ ok, results }, null, 2))
process.exit(ok ? 0 : 1)
