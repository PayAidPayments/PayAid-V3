import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value && String(value).trim()) return String(value).trim()
  }
  return ''
}

function toFlag(value) {
  return value === '1'
}

function encodeBasicAuth(user, pass) {
  return Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')
}

async function callJson({ method, url, headers = {}, body, timeoutMs }) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
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
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      bodyText: text.slice(0, 4000),
      json,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      bodyText: error instanceof Error ? error.message : String(error),
      json: null,
    }
  }
}

async function main() {
  const baseUrl = getEnv('BASE_URL', 'APP_BASE_URL', 'NEXT_PUBLIC_APP_URL').replace(/\/$/, '')
  const tenantId = getEnv('TENANT_ID', 'DEFAULT_TENANT_ID')
  const agentId = getEnv('VOICE_AGENT_BOLNA_SMOKE_AGENT_ID')
  const callSid = getEnv('VOICE_AGENT_BOLNA_SMOKE_CALL_SID') || `CA_SMOKE_${Date.now()}`
  const to = getEnv('VOICE_AGENT_BOLNA_SMOKE_TO') || '+919999999999'
  const timeoutMs = Number(process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '20000')

  // Prefer bearer token; fallback to legacy basic auth creds if available.
  const authToken = getEnv('AUTH_TOKEN', 'API_AUTH_TOKEN', 'VOICE_AGENT_BOLNA_SMOKE_AUTH_TOKEN')
  const basicUser = getEnv('VOICE_AGENT_BOLNA_SMOKE_BASIC_USER')
  const basicPass = getEnv('VOICE_AGENT_BOLNA_SMOKE_BASIC_PASS')

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'voice-agent')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-bolna-bridge-smoke.md`)

  const missing = []
  if (!baseUrl) missing.push('BASE_URL')
  if (!tenantId) missing.push('TENANT_ID')
  if (!agentId) missing.push('VOICE_AGENT_BOLNA_SMOKE_AGENT_ID')
  if (!authToken && !(basicUser && basicPass)) {
    missing.push('AUTH_TOKEN (or VOICE_AGENT_BOLNA_SMOKE_BASIC_USER/PASS)')
  }

  const lines = []
  lines.push('# Bolna Bridge Smoke')
  lines.push('')
  lines.push(`- Timestamp: ${iso}`)
  lines.push(`- Base URL: ${baseUrl || '[missing]'}`)
  lines.push(`- Tenant ID: ${tenantId || '[missing]'}`)
  lines.push(`- Agent ID: ${agentId || '[missing]'}`)
  lines.push(`- Call SID: ${callSid}`)
  lines.push(`- Destination number: ${to}`)
  lines.push(`- Timeout ms: ${timeoutMs}`)
  lines.push(`- Auth mode: ${authToken ? 'bearer' : (basicUser && basicPass ? 'basic' : 'missing')}`)
  lines.push(`- VOICE_AGENT_BOLNA_ENABLED: ${process.env.VOICE_AGENT_BOLNA_ENABLED || '[unset]'}`)
  lines.push(`- Runtime flag interpreted as enabled: ${toFlag(process.env.VOICE_AGENT_BOLNA_ENABLED || '') ? 'yes' : 'no'}`)
  lines.push('')

  if (missing.length > 0) {
    lines.push('## Result')
    lines.push('')
    lines.push(`- FAIL Missing required env: ${missing.join(', ')}`)
    writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
    console.log(JSON.stringify({ ok: false, outputPath, missing }, null, 2))
    process.exit(1)
  }

  const authHeader = authToken
    ? `Bearer ${authToken}`
    : `Basic ${encodeBasicAuth(basicUser, basicPass)}`

  const commonHeaders = {
    Authorization: authHeader,
    'Content-Type': 'application/json',
  }

  // 1) Confirm the agent record exists and includes runtime flags.
  const getAgentUrl = `${baseUrl}/api/v1/voice-agents/${encodeURIComponent(agentId)}?tenantId=${encodeURIComponent(tenantId)}`
  const agentRes = await callJson({
    method: 'GET',
    url: getAgentUrl,
    headers: commonHeaders,
    timeoutMs,
  })

  // 2) Ask PayAid to prepare a Bolna call stream (jwt + streamUrl).
  const startCallUrl = `${baseUrl}/api/v1/voice-agents/runtime/bolna/calls/start`
  const startRes = await callJson({
    method: 'POST',
    url: startCallUrl,
    headers: commonHeaders,
    body: { agentId, to, callSid },
    timeoutMs,
  })

  // 3) Verify analytics payload includes realtime block shape.
  const analyticsUrl = `${baseUrl}/api/v1/voice-agents/analytics?period=today`
  const analyticsRes = await callJson({
    method: 'GET',
    url: analyticsUrl,
    headers: commonHeaders,
    timeoutMs,
  })

  const runtimeFromAgent = agentRes.json?.voiceRuntime || null
  const streamUrl = startRes.json?.streamUrl || ''
  const hasJwt = typeof startRes.json?.jwt === 'string' && startRes.json.jwt.length > 20
  const hasRealtimeAnalytics =
    Boolean(analyticsRes.json?.analytics?.realtime) ||
    Boolean(analyticsRes.json?.analytics?.runtime)

  const checks = [
    {
      name: 'agent_fetch',
      ok: agentRes.ok,
      detail: `status=${agentRes.status ?? 'ERR'} runtime=${runtimeFromAgent ?? 'unknown'}`,
    },
    {
      name: 'calls_start',
      ok: startRes.ok && streamUrl.startsWith('wss://') && hasJwt,
      detail: `status=${startRes.status ?? 'ERR'} streamUrl=${streamUrl ? 'present' : 'missing'} jwt=${hasJwt ? 'present' : 'missing'}`,
    },
    {
      name: 'analytics_realtime_shape',
      ok: analyticsRes.ok && hasRealtimeAnalytics,
      detail: `status=${analyticsRes.status ?? 'ERR'} realtime_or_runtime=${hasRealtimeAnalytics ? 'present' : 'missing'}`,
    },
  ]

  const allOk = checks.every((c) => c.ok)

  lines.push('## Checks')
  lines.push('')
  for (const check of checks) {
    lines.push(`- ${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`)
  }
  lines.push('')

  lines.push('## Raw Responses')
  lines.push('')
  for (const [label, res, url] of [
    ['GET agent', agentRes, getAgentUrl],
    ['POST calls/start', startRes, startCallUrl],
    ['GET analytics', analyticsRes, analyticsUrl],
  ]) {
    lines.push(`### ${label}`)
    lines.push('')
    lines.push(`- URL: ${url}`)
    lines.push(`- Status: ${res.status ?? 'ERR'}`)
    lines.push(`- Duration ms: ${res.durationMs}`)
    lines.push('')
    lines.push('```text')
    lines.push(res.bodyText || '[empty]')
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
