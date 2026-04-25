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
    if (value && String(value).trim()) return { key, value: String(value).trim() }
  }
  return { key: null, value: '' }
}

function resolveBaseUrl() {
  const direct = getEnv('BASE_URL', 'APP_BASE_URL', 'NEXT_PUBLIC_APP_URL', 'CANONICAL_STAGING_BASE_URL')
  if (direct.value) return { source: direct.key, value: direct.value.replace(/\/$/, '') }
  const vercel = getEnv('VERCEL_URL')
  if (vercel.value) return { source: 'VERCEL_URL', value: `https://${vercel.value}` }
  return { source: null, value: '' }
}

const baseUrl = resolveBaseUrl()
const tenant = getEnv('TENANT_ID', 'DEFAULT_TENANT_ID', 'CRM_TENANT_ID', 'CANONICAL_STAGING_TENANT_ID')
const token = getEnv('AUTH_TOKEN', 'API_AUTH_TOKEN', 'CRM_AUTH_TOKEN', 'CANONICAL_STAGING_AUTH_TOKEN')
const campaign = getEnv('EMAIL_CAMPAIGN_ID', 'CANONICAL_STAGING_EMAIL_CAMPAIGN_ID')
const retryJob = getEnv('EMAIL_RETRY_JOB_ID', 'CANONICAL_STAGING_EMAIL_RETRY_JOB_ID')

const ready = Boolean(baseUrl.value && tenant.value && token.value && campaign.value)

const report = {
  timestamp: iso,
  ready,
  checks: {
    baseUrl: {
      present: Boolean(baseUrl.value),
      source: baseUrl.source || '[missing]',
      preview: baseUrl.value || '[missing]',
    },
    tenantId: {
      present: Boolean(tenant.value),
      source: tenant.key || '[missing]',
      preview: tenant.value || '[missing]',
    },
    authToken: {
      present: Boolean(token.value),
      source: token.key || '[missing]',
      preview: token.value ? `[set len=${token.value.length}]` : '[missing]',
    },
    emailCampaignId: {
      present: Boolean(campaign.value),
      source: campaign.key || '[missing]',
      preview: campaign.value || '[missing]',
    },
    emailRetryJobId: {
      present: Boolean(retryJob.value),
      source: retryJob.key || '[optional-missing]',
      preview: retryJob.value || '[optional-missing]',
    },
  },
}

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${stamp}-email-step41-smoke-env-readiness.md`)

const lines = []
lines.push('# Email Step 4.1 Smoke Env Readiness')
lines.push('')
lines.push(`- Timestamp: ${iso}`)
lines.push(`- Ready: ${ready ? 'yes' : 'no'}`)
lines.push('')
lines.push('## Checks')
lines.push('')
for (const [name, info] of Object.entries(report.checks)) {
  lines.push(`- ${name}: ${info.present ? 'present' : 'missing'} (source=${info.source}, preview=${info.preview})`)
}
lines.push('')
lines.push('## Raw JSON')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(report, null, 2))
lines.push('```')
lines.push('')

writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ ready, outPath }, null, 2))
process.exit(ready ? 0 : 1)

