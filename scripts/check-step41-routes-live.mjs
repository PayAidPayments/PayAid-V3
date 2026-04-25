import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value && String(value).trim()) return String(value).trim()
  }
  return ''
}

function resolveBaseUrl() {
  const direct = getEnv('BASE_URL', 'APP_BASE_URL', 'CANONICAL_STAGING_BASE_URL', 'NEXT_PUBLIC_APP_URL')
  if (direct) return direct.replace(/\/$/, '')
  if (getEnv('CANONICAL_STAGING_AUTH_TOKEN')) return 'https://payaid-v3.vercel.app'
  const vercelUrl = getEnv('VERCEL_URL')
  return vercelUrl ? `https://${vercelUrl}` : ''
}

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const baseUrl = resolveBaseUrl()
const tenantId = getEnv('TENANT_ID', 'CANONICAL_STAGING_TENANT_ID')
const campaignId = getEnv('EMAIL_CAMPAIGN_ID', 'CANONICAL_STAGING_EMAIL_CAMPAIGN_ID')
const token = getEnv('AUTH_TOKEN', 'CANONICAL_STAGING_AUTH_TOKEN')

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-step41-routes-live-check.md`)

if (!baseUrl || !tenantId || !campaignId || !token) {
  const missing = []
  if (!baseUrl) missing.push('BASE_URL')
  if (!tenantId) missing.push('TENANT_ID')
  if (!campaignId) missing.push('EMAIL_CAMPAIGN_ID')
  if (!token) missing.push('AUTH_TOKEN')
  writeFileSync(
    outputPath,
    `# Step 4.1 Routes Live Check\n\n- Timestamp: ${iso}\n- Result: FAIL\n- Missing: ${missing.join(', ')}\n`,
    'utf8'
  )
  console.log(JSON.stringify({ ok: false, outputPath, missing }, null, 2))
  process.exit(1)
}

const routes = [
  'progress',
  'failed-jobs',
  'retry-history',
]

const results = []
for (const route of routes) {
  const url = `${baseUrl}/api/marketing/email-campaigns/${campaignId}/${route}?tenantId=${encodeURIComponent(tenantId)}`
  const started = Date.now()
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20000),
    })
    const text = await res.text()
    results.push({
      route,
      url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - started,
      bodyPreview: text.slice(0, 400),
    })
  } catch (error) {
    results.push({
      route,
      url,
      status: null,
      ok: false,
      durationMs: Date.now() - started,
      bodyPreview: error instanceof Error ? error.message : String(error),
    })
  }
}

const allLive = results.every((r) => r.status !== 404)
const lines = []
lines.push('# Step 4.1 Routes Live Check')
lines.push('')
lines.push(`- Timestamp: ${iso}`)
lines.push(`- BASE_URL: ${baseUrl}`)
lines.push(`- TENANT_ID: ${tenantId}`)
lines.push(`- EMAIL_CAMPAIGN_ID: ${campaignId}`)
lines.push(`- All routes non-404: ${allLive ? 'yes' : 'no'}`)
lines.push('')
lines.push('## Route results')
lines.push('')
for (const r of results) {
  lines.push(`- ${r.route}: status=${r.status ?? 'ERR'} ok=${r.ok ? 'yes' : 'no'} (${r.durationMs}ms)`)
}
lines.push('')
lines.push('## Body previews')
lines.push('')
for (const r of results) {
  lines.push(`### ${r.route}`)
  lines.push('')
  lines.push(`- URL: ${r.url}`)
  lines.push(`- Status: ${r.status ?? 'ERR'}`)
  lines.push('')
  lines.push('```text')
  lines.push(r.bodyPreview || '[empty]')
  lines.push('```')
  lines.push('')
}

writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
console.log(JSON.stringify({ ok: allLive, outputPath, results }, null, 2))
process.exit(allLive ? 0 : 1)

