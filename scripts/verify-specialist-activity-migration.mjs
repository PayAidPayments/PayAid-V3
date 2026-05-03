import 'dotenv/config'
import { Client } from 'pg'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required to verify specialist activity migration.')
  process.exit(1)
}

const startedAt = new Date()
const startedAtIso = startedAt.toISOString()
const timestamp = startedAtIso.replace(/[:.]/g, '-')

function resolveSslConfig(connectionString) {
  const lower = connectionString.toLowerCase()
  const isLocal =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('host.docker.internal')
  const requiresSsl = lower.includes('supabase.com') || lower.includes('sslmode=require')
  if (!isLocal && requiresSsl) {
    return { rejectUnauthorized: false }
  }
  return undefined
}

function buildMarkdown(result, outputPath) {
  const lines = []
  lines.push('# Specialist Activity Migration Verification')
  lines.push('')
  lines.push(`- Timestamp: ${result.timestamp}`)
  lines.push(`- Database host: ${result.databaseHost}`)
  lines.push(`- Table exists: ${result.tableExists ? 'yes' : 'no'}`)
  lines.push(`- Column count: ${result.columnCount}`)
  lines.push(`- Tenant FK column exists: ${result.hasTenantId ? 'yes' : 'no'}`)
  lines.push(`- SessionId column exists: ${result.hasSessionId ? 'yes' : 'no'}`)
  lines.push(`- PermissionResult column exists: ${result.hasPermissionResult ? 'yes' : 'no'}`)
  lines.push(`- Rows currently present: ${result.rowCount}`)
  lines.push(`- Matching migration files in DB history: ${result.specialistNamedMigrations}`)
  lines.push(`- Output file: ${outputPath}`)
  lines.push('')
  lines.push('## Raw JSON')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(result, null, 2))
  lines.push('```')
  return `${lines.join('\n')}\n`
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: resolveSslConfig(databaseUrl),
  statement_timeout: 30000,
  query_timeout: 30000,
  connectionTimeoutMillis: 30000,
})

;(async () => {
  await client.connect()

  const dbHost = new URL(databaseUrl).hostname

  const tableResult = await client.query(
    `SELECT to_regclass('public."SpecialistActivityLog"')::text AS table_name`
  )
  const tableName = tableResult.rows[0]?.table_name ?? null
  const tableExists = Boolean(tableName)

  const columnResult = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'SpecialistActivityLog'`
  )
  const columns = new Set(columnResult.rows.map((row) => row.column_name))

  let rowCount = 0
  if (tableExists) {
    const rowCountResult = await client.query(`SELECT COUNT(*)::int AS count FROM "SpecialistActivityLog"`)
    rowCount = Number(rowCountResult.rows[0]?.count ?? 0)
  }

  const migrationResult = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM "_prisma_migrations"
     WHERE migration_name ILIKE '%specialist%'`
  )

  const result = {
    timestamp: startedAtIso,
    databaseHost: dbHost,
    tableExists,
    tableName,
    columnCount: columns.size,
    hasTenantId: columns.has('tenantId'),
    hasSessionId: columns.has('sessionId'),
    hasPermissionResult: columns.has('permissionResult'),
    rowCount,
    specialistNamedMigrations: Number(migrationResult.rows[0]?.count ?? 0),
  }

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'ai')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${timestamp}-specialist-activity-migration-verification.md`)
  const markdown = buildMarkdown(result, outputPath)
  writeFileSync(outputPath, markdown, 'utf8')

  console.log(JSON.stringify({ ...result, outputPath }, null, 2))

  const pass =
    tableExists &&
    result.hasTenantId &&
    result.hasSessionId &&
    result.hasPermissionResult

  process.exit(pass ? 0 : 2)
})()
  .catch((error) => {
    console.error(`Migration verification failed: ${error?.message || error}`)
    process.exit(1)
  })
  .finally(async () => {
    await client.end().catch(() => {})
  })
