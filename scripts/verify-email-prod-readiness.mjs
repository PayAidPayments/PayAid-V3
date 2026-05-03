import net from 'node:net'
import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')

function deriveRedisUrlFromUpstash() {
  const existing = process.env.REDIS_URL || ''
  if (existing) return { redisUrl: existing, source: 'REDIS_URL' }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL || ''
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  if (!restUrl || !restToken) return { redisUrl: '', source: 'missing' }

  try {
    const parsed = new URL(restUrl)
    const host = parsed.hostname
    const port = parsed.port || '6379'
    const encodedToken = encodeURIComponent(restToken)
    return {
      redisUrl: `rediss://default:${encodedToken}@${host}:${port}`,
      source: 'derived_from_upstash_rest',
    }
  } catch {
    return { redisUrl: '', source: 'invalid_upstash_rest_url' }
  }
}

function parseRedisUrl(redisUrl) {
  if (!redisUrl) return null
  try {
    const parsed = new URL(redisUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 6379,
    }
  } catch {
    return null
  }
}

function checkRedisTcp(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (ok, detail) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({ ok, detail })
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true, `Connected to ${host}:${port}`))
    socket.once('timeout', () => finish(false, `Timeout after ${timeoutMs}ms`))
    socket.once('error', (err) => finish(false, err.message || 'Unknown socket error'))

    socket.connect(port, host)
  })
}

async function checkDatabase(databaseUrl) {
  const requiredTables = [
    'EmailSendJob',
    'EmailTrackingEvent',
    'EmailSyncCheckpoint',
    'EmailDeliverabilityLog',
    'EmailCampaignSenderPolicy',
  ]

  if (!databaseUrl) {
    return {
      connected: false,
      detail: 'DATABASE_URL is missing',
      tables: Object.fromEntries(requiredTables.map((name) => [name, false])),
    }
  }

  const client = new Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    await client.query('SELECT 1')

    const tableChecks = {}
    for (const tableName of requiredTables) {
      const res = await client.query('SELECT to_regclass($1) AS table_name', [`public."${tableName}"`])
      tableChecks[tableName] = Boolean(res.rows?.[0]?.table_name)
    }

    return {
      connected: true,
      detail: 'Connected and basic query succeeded',
      tables: tableChecks,
    }
  } catch (error) {
    return {
      connected: false,
      detail: error instanceof Error ? error.message : String(error),
      tables: Object.fromEntries(requiredTables.map((name) => [name, false])),
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

function toMarkdown(report) {
  const lines = []
  lines.push('# Email Production Readiness Check')
  lines.push('')
  lines.push(`- Timestamp: ${report.timestamp}`)
  lines.push(`- Environment: ${report.environment}`)
  lines.push(`- Overall ready: ${report.overallReady ? 'yes' : 'no'}`)
  lines.push('')
  lines.push('## Redis TCP')
  lines.push('')
  lines.push(`- Config present: ${report.redis.configPresent ? 'yes' : 'no'}`)
  lines.push(`- Endpoint: ${report.redis.host || '[missing]'}:${report.redis.port || '[missing]'}`)
  lines.push(`- TCP reachable: ${report.redis.tcpReachable ? 'yes' : 'no'}`)
  lines.push(`- Detail: ${report.redis.detail}`)
  lines.push('')
  lines.push('## Database')
  lines.push('')
  lines.push(`- DATABASE_URL present: ${report.database.configPresent ? 'yes' : 'no'}`)
  lines.push(`- Connected: ${report.database.connected ? 'yes' : 'no'}`)
  lines.push(`- Detail: ${report.database.detail}`)
  lines.push('')
  lines.push('## Required Email Tables')
  lines.push('')
  for (const [tableName, exists] of Object.entries(report.database.tables)) {
    lines.push(`- ${tableName}: ${exists ? 'present' : 'missing'}`)
  }
  lines.push('')
  lines.push('## Raw JSON')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(report, null, 2))
  lines.push('```')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || ''
  const redisResolution = deriveRedisUrlFromUpstash()
  const redisUrl = redisResolution.redisUrl
  const redisParsed = parseRedisUrl(redisUrl)

  const redisCheck = redisParsed
    ? await checkRedisTcp(redisParsed.host, redisParsed.port)
    : { ok: false, detail: 'REDIS_URL is missing or invalid' }
  const dbCheck = await checkDatabase(databaseUrl)

  const overallReady =
    Boolean(redisParsed) &&
    redisCheck.ok &&
    dbCheck.connected &&
    Object.values(dbCheck.tables).every(Boolean)

  const report = {
    timestamp: iso,
    environment: process.env.NODE_ENV || 'unknown',
    overallReady,
    redis: {
      source: redisResolution.source,
      configPresent: Boolean(redisParsed),
      host: redisParsed?.host || null,
      port: redisParsed?.port || null,
      tcpReachable: redisCheck.ok,
      detail: redisCheck.detail,
    },
    database: {
      configPresent: Boolean(databaseUrl),
      connected: dbCheck.connected,
      detail: dbCheck.detail,
      tables: dbCheck.tables,
    },
  }

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
  mkdirSync(outputDir, { recursive: true })

  const jsonPath = path.join(outputDir, `${stamp}-email-prod-readiness.json`)
  const mdPath = path.join(outputDir, `${stamp}-email-prod-readiness.md`)
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')
  writeFileSync(mdPath, toMarkdown(report), 'utf8')

  console.log(
    JSON.stringify(
      {
        overallReady: report.overallReady,
        jsonPath,
        mdPath,
      },
      null,
      2
    )
  )

  process.exit(report.overallReady ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

