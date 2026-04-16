import 'dotenv/config'
import { Client } from 'pg'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const startedAt = new Date()
const stamp = startedAt.toISOString().replace(/[:.]/g, '-')

function resolveSslConfig(connectionString) {
  const lower = connectionString.toLowerCase()
  const isLocal =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('host.docker.internal')
  const requiresSsl = lower.includes('supabase.com') || lower.includes('sslmode=require')
  if (!isLocal && requiresSsl) return { rejectUnauthorized: false }
  return undefined
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: resolveSslConfig(databaseUrl),
  connectionTimeoutMillis: 30000,
  statement_timeout: 30000,
  query_timeout: 30000,
})

;(async () => {
  await client.connect()

  const host = new URL(databaseUrl).hostname
  const tenantRow = await client.query('SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1')
  const tenantId = tenantRow.rows[0]?.id ?? null
  if (!tenantId) {
    throw new Error('No tenant found in database; cannot verify activity feed status.')
  }

  let source = 'legacy_audit'
  let migrationReady = false
  let fallbackReason = null
  let checkedRows = 0

  try {
    const result = await client.query(
      'SELECT "id" FROM "SpecialistActivityLog" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 5',
      [tenantId]
    )
    checkedRows = result.rowCount || 0
    source = 'specialist_table'
    migrationReady = true
  } catch (error) {
    const message = String(error?.message || '').toLowerCase()
    fallbackReason = message.includes('specialistactivitylog')
      ? 'specialist_activity_table_unavailable'
      : 'specialist_activity_query_failed'
  }

  const payload = {
    timestamp: startedAt.toISOString(),
    databaseHost: host,
    tenantId,
    source,
    migrationReady,
    fallbackReason,
    checkedRows,
    expectedUiBadges: {
      sourceBadge: source === 'specialist_table' ? 'Specialist table' : 'Legacy audit fallback',
      migrationBadge: migrationReady ? 'Migration ready' : 'Migration pending',
    },
  }

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'ai')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-specialist-activity-ui-status-verification.md`)
  const content = [
    '# Specialist Activity UI Status Verification',
    '',
    `- Timestamp: ${payload.timestamp}`,
    `- Database host: ${payload.databaseHost}`,
    `- Tenant ID checked: ${payload.tenantId}`,
    `- Source: ${payload.source}`,
    `- Migration ready: ${payload.migrationReady ? 'yes' : 'no'}`,
    `- Fallback reason: ${payload.fallbackReason || 'none'}`,
    `- Rows sampled: ${payload.checkedRows}`,
    '',
    '## Expected Agent Activity badges',
    '',
    `- Source badge: ${payload.expectedUiBadges.sourceBadge}`,
    `- Migration badge: ${payload.expectedUiBadges.migrationBadge}`,
    '',
    '## Raw JSON',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
  ].join('\n')
  writeFileSync(outputPath, content, 'utf8')

  console.log(JSON.stringify({ ...payload, outputPath }, null, 2))
  process.exit(payload.source === 'specialist_table' && payload.migrationReady ? 0 : 2)
})()
  .catch((error) => {
    console.error(`Failed to verify UI status parity: ${error?.message || error}`)
    process.exit(1)
  })
  .finally(async () => {
    await client.end().catch(() => {})
  })
