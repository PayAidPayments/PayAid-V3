import 'dotenv/config'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const migrationFile = path.join(
  process.cwd(),
  'prisma',
  'migrations',
  '20260415103000_add_specialist_activity_log',
  'migration.sql'
)

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

const sql = readFileSync(migrationFile, 'utf8')

const client = new Client({
  connectionString: databaseUrl,
  ssl: resolveSslConfig(databaseUrl),
  statement_timeout: 60000,
  query_timeout: 60000,
  connectionTimeoutMillis: 30000,
})

;(async () => {
  await client.connect()
  await client.query('BEGIN')
  await client.query(sql)
  await client.query('COMMIT')

  console.log(
    JSON.stringify(
      {
        applied: true,
        migrationFile,
        host: new URL(databaseUrl).hostname,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  )
})()
  .catch(async (error) => {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`Failed to apply specialist migration SQL: ${error?.message || error}`)
    process.exit(1)
  })
  .finally(async () => {
    await client.end().catch(() => {})
  })
