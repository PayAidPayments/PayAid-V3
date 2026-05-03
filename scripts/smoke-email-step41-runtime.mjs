import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')

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
  const hasCanonicalToken = Boolean(getEnv('CANONICAL_STAGING_AUTH_TOKEN'))
  if (hasCanonicalToken) return 'https://payaid-v3.vercel.app'
  const vercelUrl = getEnv('VERCEL_URL')
  return vercelUrl ? `https://${vercelUrl}` : ''
}

const baseUrl = resolveBaseUrl()
const tenantId = getEnv('TENANT_ID', 'DEFAULT_TENANT_ID', 'CRM_TENANT_ID', 'CANONICAL_STAGING_TENANT_ID')
const authToken = getEnv('AUTH_TOKEN', 'API_AUTH_TOKEN', 'CRM_AUTH_TOKEN', 'CANONICAL_STAGING_AUTH_TOKEN')
const campaignId = getEnv('EMAIL_CAMPAIGN_ID', 'CANONICAL_STAGING_EMAIL_CAMPAIGN_ID')
const retryJobId = process.env.EMAIL_RETRY_JOB_ID || ''
const requestTimeoutMs = Number(process.env.EMAIL_STEP41_SMOKE_TIMEOUT_MS || '20000')

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-email-step41-runtime-smoke.md`)

function toStatusLine(ok) {
  return ok ? 'PASS' : 'FAIL'
}

async function apiCall({ label, method, url, body }) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      method,
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return {
      label,
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      bodyText: text.slice(0, 3000),
      json,
      url,
      method,
    }
  } catch (error) {
    return {
      label,
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      bodyText: error instanceof Error ? error.message : String(error),
      json: null,
      url,
      method,
    }
  }
}

async function main() {
  const missing = []
  if (!baseUrl) missing.push('BASE_URL')
  if (!tenantId) missing.push('TENANT_ID')
  if (!authToken) missing.push('AUTH_TOKEN')
  if (!campaignId) missing.push('EMAIL_CAMPAIGN_ID')

  const lines = []
  lines.push('# Email Step 4.1 Runtime Smoke')
  lines.push('')
  lines.push(`- Timestamp: ${iso}`)
  lines.push(`- BASE_URL: ${baseUrl || '[missing]'}`)
  lines.push(`- TENANT_ID: ${tenantId || '[missing]'}`)
  lines.push(`- EMAIL_CAMPAIGN_ID: ${campaignId || '[missing]'}`)
  lines.push(`- EMAIL_RETRY_JOB_ID: ${retryJobId || '[not set]'}`)
  lines.push(`- AUTH_TOKEN present: ${authToken ? 'yes' : 'no'}`)
  lines.push('')

  if (missing.length > 0) {
    lines.push('## Result')
    lines.push('')
    lines.push(`- ${toStatusLine(false)} Missing required env: ${missing.join(', ')}`)
    writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
    console.log(JSON.stringify({ ok: false, outputPath, missing }, null, 2))
    process.exit(1)
  }

  const baseCampaign = `${baseUrl}/api/marketing/email-campaigns/${campaignId}`
  const calls = []

  calls.push(
    await apiCall({
      label: 'progress',
      method: 'GET',
      url: `${baseCampaign}/progress?tenantId=${encodeURIComponent(tenantId)}`,
    })
  )

  calls.push(
    await apiCall({
      label: 'failed-jobs',
      method: 'GET',
      url: `${baseCampaign}/failed-jobs?tenantId=${encodeURIComponent(tenantId)}&limit=20`,
    })
  )

  calls.push(
    await apiCall({
      label: 'retry-history',
      method: 'GET',
      url: `${baseCampaign}/retry-history?tenantId=${encodeURIComponent(tenantId)}&limit=20`,
    })
  )

  if (retryJobId) {
    calls.push(
      await apiCall({
        label: 'single-retry',
        method: 'POST',
        url: `${baseCampaign}/retry/${retryJobId}?tenantId=${encodeURIComponent(tenantId)}`,
        body: {},
      })
    )
  }

  const allOk = calls.every((c) => c.ok)
  lines.push('## Endpoint checks')
  lines.push('')
  for (const c of calls) {
    lines.push(`- ${c.label}: ${toStatusLine(c.ok)} (${c.method} ${c.status ?? 'ERR'} in ${c.durationMs}ms)`)
  }
  lines.push('')
  lines.push('## Raw responses')
  lines.push('')
  for (const c of calls) {
    lines.push(`### ${c.label}`)
    lines.push('')
    lines.push(`- URL: ${c.url}`)
    lines.push(`- Method: ${c.method}`)
    lines.push(`- Status: ${c.status ?? 'ERR'}`)
    lines.push(`- Duration ms: ${c.durationMs}`)
    lines.push('')
    lines.push('```text')
    lines.push(c.bodyText || '[empty]')
    lines.push('```')
    lines.push('')
  }

  writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(JSON.stringify({ ok: allOk, outputPath }, null, 2))
  process.exit(allOk ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

