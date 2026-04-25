import { spawnSync } from 'node:child_process'
import { Client } from 'pg'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })
const PIPELINE_TIMEOUT_MS = Number(process.env.EMAIL_STEP41_PIPELINE_TIMEOUT_MS || '90000')
const LOGIN_TIMEOUT_MS = Number(process.env.EMAIL_STEP41_LOGIN_TIMEOUT_MS || '15000')

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

async function maybeResolveTenantAndCampaign() {
  const databaseUrl = getEnv('DATABASE_URL')
  const tenantId = getEnv('TENANT_ID', 'DEFAULT_TENANT_ID', 'CRM_TENANT_ID', 'CANONICAL_STAGING_TENANT_ID')
  let campaignId = getEnv('EMAIL_CAMPAIGN_ID', 'CANONICAL_STAGING_EMAIL_CAMPAIGN_ID')

  if (!databaseUrl) return { tenantId, campaignId, note: 'DATABASE_URL missing; cannot auto-resolve IDs.' }

  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    let resolvedTenant = tenantId

    if (!resolvedTenant) {
      const tenantRes = await client.query('SELECT id FROM "Tenant" ORDER BY "createdAt" DESC NULLS LAST LIMIT 1')
      resolvedTenant = tenantRes.rows?.[0]?.id || ''
    }

    if (!campaignId && resolvedTenant) {
      const campaignRes = await client.query(
        'SELECT id FROM "Campaign" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC NULLS LAST LIMIT 1',
        [resolvedTenant]
      )
      campaignId = campaignRes.rows?.[0]?.id || ''
    }

    if (!campaignId) {
      const campaignAny = await client.query('SELECT id FROM "Campaign" ORDER BY "createdAt" DESC NULLS LAST LIMIT 1')
      campaignId = campaignAny.rows?.[0]?.id || ''
    }

    if (!campaignId && resolvedTenant) {
      const sendJobCampaign = await client.query(
        'SELECT "campaignId" FROM "EmailSendJob" WHERE "tenantId" = $1 AND "campaignId" IS NOT NULL ORDER BY "createdAt" DESC NULLS LAST LIMIT 1',
        [resolvedTenant]
      )
      campaignId = sendJobCampaign.rows?.[0]?.campaignId || ''
    }

    if (!campaignId) {
      const policyCampaign = await client.query(
        'SELECT "campaignId" FROM "EmailCampaignSenderPolicy" ORDER BY "updatedAt" DESC NULLS LAST LIMIT 1'
      )
      campaignId = policyCampaign.rows?.[0]?.campaignId || ''
    }

    return {
      tenantId: resolvedTenant,
      campaignId,
      note: 'Auto-resolve attempted from DB (Campaign, EmailSendJob, EmailCampaignSenderPolicy).',
    }
  } catch (error) {
    return {
      tenantId,
      campaignId,
      note: `DB resolve failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function maybeGetAuthToken(baseUrl) {
  const existing = getEnv('AUTH_TOKEN', 'API_AUTH_TOKEN', 'CRM_AUTH_TOKEN', 'CANONICAL_STAGING_AUTH_TOKEN')
  if (existing) return { token: existing, note: 'Using existing token from env.' }

  const email = getEnv(
    'CANONICAL_STAGING_LOGIN_EMAIL',
    'LOGIN_EMAIL',
    'ADMIN_EMAIL',
    'DEMO_ADMIN_EMAIL',
    'TEST_USER_EMAIL'
  )
  const password = getEnv(
    'CANONICAL_STAGING_LOGIN_PASSWORD',
    'LOGIN_PASSWORD',
    'ADMIN_PASSWORD',
    'DEMO_ADMIN_PASSWORD',
    'TEST_USER_PASSWORD'
  )
  if (!baseUrl || !email || !password) {
    return { token: '', note: 'Missing base URL or login credentials for token mint.' }
  }

  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await res.json().catch(() => ({}))
    const token =
      body?.token ||
      body?.accessToken ||
      body?.jwt ||
      body?.data?.token ||
      body?.user?.token ||
      ''
    if (!res.ok || !token) {
      return { token: '', note: `Login failed (${res.status}); token missing.` }
    }
    return { token, note: 'Token minted via /api/auth/login.' }
  } catch (error) {
    return { token: '', note: `Token mint failed: ${error instanceof Error ? error.message : String(error)}` }
  }
}

function runCommand(command, envOverrides = {}) {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    env: { ...process.env, ...envOverrides },
    encoding: 'utf8',
    timeout: PIPELINE_TIMEOUT_MS,
    shell: true,
  })
  return {
    ok: result.status === 0 && !(result.error && result.error.code === 'ETIMEDOUT'),
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    timedOut: Boolean(result.error && result.error.code === 'ETIMEDOUT'),
  }
}

async function main() {
  const now = new Date()
  const iso = now.toISOString()
  const stamp = iso.replace(/[:.]/g, '-')
  const baseUrl = resolveBaseUrl()
  const { tenantId, campaignId, note: idNote } = await maybeResolveTenantAndCampaign()
  const { token, note: tokenNote } = await maybeGetAuthToken(baseUrl)

  const envOverrides = {
    BASE_URL: baseUrl,
    TENANT_ID: tenantId,
    AUTH_TOKEN: token,
    EMAIL_CAMPAIGN_ID: campaignId,
  }

  const envCheck = runCommand('npm run check:email-step41-smoke-env', envOverrides)
  const smoke = runCommand('npm run smoke:email-step41-runtime', envOverrides)
  const ok = envCheck.ok && smoke.ok

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-email-step41-auth-smoke-pipeline.md`)

  const lines = []
  lines.push('# Email Step 4.1 Auth Smoke Pipeline')
  lines.push('')
  lines.push(`- Timestamp: ${iso}`)
  lines.push(`- Overall ok: ${ok ? 'yes' : 'no'}`)
  lines.push(`- BASE_URL: ${baseUrl || '[missing]'}`)
  lines.push(`- TENANT_ID: ${tenantId || '[missing]'}`)
  lines.push(`- AUTH_TOKEN present: ${token ? 'yes' : 'no'}`)
  lines.push(`- EMAIL_CAMPAIGN_ID: ${campaignId || '[missing]'}`)
  lines.push(`- ID resolve note: ${idNote}`)
  lines.push(`- Token resolve note: ${tokenNote}`)
  lines.push('')
  lines.push('## Command status')
  lines.push('')
  lines.push(`- check:email-step41-smoke-env: ${envCheck.ok ? 'PASS' : 'FAIL'} (exit=${envCheck.status ?? 'null'})`)
  lines.push(`- smoke:email-step41-runtime: ${smoke.ok ? 'PASS' : 'FAIL'} (exit=${smoke.status ?? 'null'})`)
  if (envCheck.timedOut || smoke.timedOut) {
    lines.push(`- Timed out: check=${envCheck.timedOut ? 'yes' : 'no'}, smoke=${smoke.timedOut ? 'yes' : 'no'}`)
  }
  lines.push('')
  lines.push('## check:email-step41-smoke-env output')
  lines.push('')
  lines.push('```text')
  lines.push(envCheck.stdout || envCheck.stderr || '[no output]')
  lines.push('```')
  lines.push('')
  lines.push('## smoke:email-step41-runtime output')
  lines.push('')
  lines.push('```text')
  lines.push(smoke.stdout || smoke.stderr || '[no output]')
  lines.push('```')
  lines.push('')
  writeFileSync(outputPath, lines.join('\n'), 'utf8')

  console.log(
    JSON.stringify(
      {
        ok,
        outputPath,
        resolved: {
          baseUrl: baseUrl || '[missing]',
          tenantId: tenantId || '[missing]',
          authTokenPresent: Boolean(token),
          emailCampaignId: campaignId || '[missing]',
          idNote,
          tokenNote,
        },
        envCheck: {
          ok: envCheck.ok,
          status: envCheck.status,
        },
        smoke: {
          ok: smoke.ok,
          status: smoke.status,
        },
      },
      null,
      2
    )
  )

  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

