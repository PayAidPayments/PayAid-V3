import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')

const requiredTables = [
  'EmailSendJob',
  'EmailTrackingEvent',
  'EmailSyncCheckpoint',
  'EmailDeliverabilityLog',
  'EmailCampaignSenderPolicy',
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL || ''
  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
  mkdirSync(outputDir, { recursive: true })

  const report = {
    timestamp: iso,
    databaseUrlPresent: Boolean(databaseUrl),
    connected: false,
    dbDetail: '',
    migrationTableExists: false,
    latestMigrations: [],
    requiredTables: Object.fromEntries(requiredTables.map((t) => [t, false])),
  }

  if (!databaseUrl) {
    report.dbDetail = 'DATABASE_URL is missing'
  } else {
    const client = new Client({ connectionString: databaseUrl })
    try {
      await client.connect()
      report.connected = true
      report.dbDetail = 'Connected successfully'

      const migExistsRes = await client.query('SELECT to_regclass($1) AS table_name', ['public."_prisma_migrations"'])
      report.migrationTableExists = Boolean(migExistsRes.rows?.[0]?.table_name)

      if (report.migrationTableExists) {
        const migRows = await client.query(
          'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC NULLS LAST LIMIT 10'
        )
        report.latestMigrations = migRows.rows.map((r) => ({
          migrationName: r.migration_name,
          finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : null,
        }))
      }

      for (const tableName of requiredTables) {
        const res = await client.query('SELECT to_regclass($1) AS table_name', [`public."${tableName}"`])
        report.requiredTables[tableName] = Boolean(res.rows?.[0]?.table_name)
      }
    } catch (error) {
      report.dbDetail = error instanceof Error ? error.message : String(error)
    } finally {
      await client.end().catch(() => undefined)
    }
  }

  const markdownPath = path.join(outputDir, `${stamp}-email-db-state.md`)
  const jsonPath = path.join(outputDir, `${stamp}-email-db-state.json`)
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')

  const lines = []
  lines.push('# Email DB State Evidence')
  lines.push('')
  lines.push(`- Timestamp: ${report.timestamp}`)
  lines.push(`- DATABASE_URL present: ${report.databaseUrlPresent ? 'yes' : 'no'}`)
  lines.push(`- Connected: ${report.connected ? 'yes' : 'no'}`)
  lines.push(`- Detail: ${report.dbDetail}`)
  lines.push(`- _prisma_migrations exists: ${report.migrationTableExists ? 'yes' : 'no'}`)
  lines.push('')
  lines.push('## Latest migrations (up to 10)')
  lines.push('')
  if (report.latestMigrations.length === 0) {
    lines.push('- none')
  } else {
    for (const item of report.latestMigrations) {
      lines.push(`- ${item.migrationName} (${item.finishedAt || 'unfinished'})`)
    }
  }
  lines.push('')
  lines.push('## Required email tables')
  lines.push('')
  for (const [tableName, exists] of Object.entries(report.requiredTables)) {
    lines.push(`- ${tableName}: ${exists ? 'present' : 'missing'}`)
  }
  lines.push('')
  lines.push('## Raw JSON')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(report, null, 2))
  lines.push('```')
  lines.push('')

  writeFileSync(markdownPath, lines.join('\n'), 'utf8')
  console.log(JSON.stringify({ markdownPath, jsonPath, connected: report.connected }, null, 2))
  process.exit(report.connected ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

