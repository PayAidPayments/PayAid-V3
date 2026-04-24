import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
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

function summarizeUrl(value, kind) {
  if (!value) return { present: false, preview: '[missing]' }
  try {
    const parsed = new URL(value)
    const host = parsed.hostname || '[missing-host]'
    const port = parsed.port || (kind === 'redis' ? '6379' : '5432')
    return {
      present: true,
      preview: `${host}:${port}`,
    }
  } catch {
    return {
      present: true,
      preview: '[invalid-url]',
    }
  }
}

const databaseUrl = process.env.DATABASE_URL || ''
const redisResolution = deriveRedisUrlFromUpstash()
const redisUrl = redisResolution.redisUrl
const upstashRestUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const upstashRestToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

const db = summarizeUrl(databaseUrl, 'db')
const redis = summarizeUrl(redisUrl, 'redis')

const result = {
  timestamp: iso,
  nodeEnv: process.env.NODE_ENV || 'unknown',
  shellCwd: process.cwd(),
  checks: {
    DATABASE_URL: db,
    REDIS_URL: redis,
    REDIS_URL_SOURCE: {
      present: redisResolution.source !== 'missing',
      preview: redisResolution.source,
    },
    UPSTASH_REDIS_REST_URL: summarizeUrl(upstashRestUrl, 'redis'),
    UPSTASH_REDIS_REST_TOKEN: {
      present: Boolean(upstashRestToken),
      preview: upstashRestToken ? `[set len=${upstashRestToken.length}]` : '[missing]',
    },
  },
  readyForPrecheck: db.present && redis.present && db.preview !== '[invalid-url]' && redis.preview !== '[invalid-url]',
}

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-email-precheck-env-readiness.md`)

const lines = []
lines.push('# Email Precheck Env Readiness')
lines.push('')
lines.push(`- Timestamp: ${result.timestamp}`)
lines.push(`- NODE_ENV: ${result.nodeEnv}`)
lines.push(`- Working directory: ${result.shellCwd}`)
lines.push(`- Ready for precheck command: ${result.readyForPrecheck ? 'yes' : 'no'}`)
lines.push('')
lines.push('## Variable checks')
lines.push('')
lines.push(`- DATABASE_URL present: ${result.checks.DATABASE_URL.present ? 'yes' : 'no'}`)
lines.push(`- DATABASE_URL endpoint preview: ${result.checks.DATABASE_URL.preview}`)
lines.push(`- REDIS_URL present: ${result.checks.REDIS_URL.present ? 'yes' : 'no'}`)
lines.push(`- REDIS_URL endpoint preview: ${result.checks.REDIS_URL.preview}`)
lines.push(`- REDIS_URL source: ${result.checks.REDIS_URL_SOURCE.preview}`)
lines.push(`- UPSTASH_REDIS_REST_URL present: ${result.checks.UPSTASH_REDIS_REST_URL.present ? 'yes' : 'no'}`)
lines.push(`- UPSTASH_REDIS_REST_URL endpoint preview: ${result.checks.UPSTASH_REDIS_REST_URL.preview}`)
lines.push(`- UPSTASH_REDIS_REST_TOKEN present: ${result.checks.UPSTASH_REDIS_REST_TOKEN.present ? 'yes' : 'no'}`)
if (!result.checks.REDIS_URL.present && result.checks.UPSTASH_REDIS_REST_URL.present) {
  lines.push('')
  lines.push('## Note')
  lines.push('')
  lines.push('- Upstash REST appears configured, but Bull/worker precheck requires TCP `REDIS_URL`.')
}
lines.push('')
lines.push('## Raw JSON')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(result, null, 2))
lines.push('```')
lines.push('')

writeFileSync(outputPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ ...result, outputPath }, null, 2))

process.exit(result.readyForPrecheck ? 0 : 1)

