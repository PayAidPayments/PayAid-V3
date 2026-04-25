import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

function parseCliArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const eq = token.indexOf('=')
    if (eq > -1) {
      out[token.slice(2, eq)] = token.slice(eq + 1)
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = 'true'
    }
  }
  return out
}

const cli = parseCliArgs(process.argv.slice(2))
const BASE_URL = (cli.baseUrl || process.env.CANONICAL_STAGING_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '')
const LABEL = cli.label || process.env.CANONICAL_MONITOR_CHECKPOINT_LABEL || 'adhoc'
const LOGIN_EMAIL = cli.email || process.env.CANONICAL_STAGING_LOGIN_EMAIL || 'admin@demo.com'
const LOGIN_PASSWORD =
  cli.password || process.env.CANONICAL_STAGING_LOGIN_PASSWORD || process.env.TEST_PASSWORD || 'Test@1234'
const BEARER_TOKEN = cli.token || process.env.CANONICAL_STAGING_AUTH_TOKEN || ''

function topLevelKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return []
  return Object.keys(obj).sort()
}

async function requestJson(url, init = {}) {
  const res = await fetch(url, init)
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, ok: res.ok, keys: topLevelKeys(body), body }
}

async function requestText(url) {
  const res = await fetch(url)
  const text = await res.text()
  return { status: res.status, ok: res.ok, hasOverlay: text.includes('Application error: a server-side exception') }
}

async function resolveToken() {
  if (BEARER_TOKEN) return { token: BEARER_TOKEN, source: 'env-token' }
  const login = await requestJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  })
  const token = login.body?.token || null
  return { token, source: token ? 'login' : 'none', loginStatus: login.status }
}

async function run() {
  const checks = []
  const blockers = []

  if (!BASE_URL) blockers.push('CANONICAL_STAGING_BASE_URL/BASE_URL is missing')
  if (blockers.length > 0) return { mode: 'blocked', blockers, checks }
  const tokenResult = await resolveToken()
  const authHeaders = tokenResult.token ? { Authorization: `Bearer ${tokenResult.token}` } : {}

  const uiRoutes = ['/dashboard/modules', '/industries/retail', '/signup']
  for (const route of uiRoutes) {
    const r = await requestText(`${BASE_URL}${route}`)
    checks.push({
      id: `UI:${route}`,
      kind: 'ui',
      status: r.status,
      pass: r.status !== 404 && r.status !== 500 && !r.hasOverlay,
      overlay: r.hasOverlay,
    })
  }

  const apiRoutes = [
    { id: 'API:/api/modules', endpoint: '/api/modules', required: ['canonical', 'taxonomy'] },
    {
      id: 'API:/api/industries/retail/modules',
      endpoint: '/api/industries/retail/modules',
      required: ['industry', 'canonical', 'suites', 'capabilities', 'optionalSuites'],
    },
  ]
  for (const api of apiRoutes) {
    const r = await requestJson(`${BASE_URL}${api.endpoint}`, { headers: { ...authHeaders } })
    checks.push({
      id: api.id,
      kind: 'api',
      status: r.status,
      pass: r.ok && api.required.every((k) => r.keys.includes(k)),
      keys: r.keys,
    })
  }

  const mutationRoutes = [
    {
      id: 'API:/api/industries/custom/modules',
      endpoint: '/api/industries/custom/modules',
      body: { industryName: 'Canonical Monitor Industry', coreModules: ['crm'], industryFeatures: [] },
      required: ['success', 'canonical', 'industryName'],
    },
    {
      id: 'API:/api/ai/analyze-industry',
      endpoint: '/api/ai/analyze-industry',
      body: { industryName: 'Retail' },
      required: ['industryName', 'canonical', 'industryFeatures', 'description', 'keyProcesses'],
    },
  ]
  for (const api of mutationRoutes) {
    const r = await requestJson(`${BASE_URL}${api.endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders },
      body: JSON.stringify(api.body),
    })
    checks.push({
      id: api.id,
      kind: 'api',
      status: r.status,
      pass: r.ok && api.required.every((k) => r.keys.includes(k)),
      keys: r.keys,
    })
  }

  const overallOk = checks.every((c) => c.pass)
  return {
    mode: 'executed',
    overallOk,
    checks,
    tokenSource: tokenResult.source,
    tokenAvailable: Boolean(tokenResult.token),
    loginStatus: tokenResult.loginStatus ?? null,
  }
}

const result = await run()
const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-post-enable-monitor-checkpoint-${LABEL}.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-post-enable-monitor-checkpoint-${LABEL}.md`)

const payload = {
  check: 'canonical-post-enable-monitor-checkpoint',
  checkpointLabel: LABEL,
  timestamp: isoNow,
  baseUrl: BASE_URL || '[missing]',
  ...result,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical post-enable monitor checkpoint')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Checkpoint label: ${LABEL}`)
lines.push(`- Base URL: ${BASE_URL || '[missing]'}`)
lines.push(`- Mode: ${result.mode}`)
if ('overallOk' in result) lines.push(`- Overall: ${result.overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Checks')
lines.push('')
for (const c of result.checks || []) {
  lines.push(`- ${c.pass ? 'PASS' : 'FAIL'} ${c.id} (${c.status})`)
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk: result.overallOk === true, mode: result.mode, jsonPath, mdPath }, null, 2))
process.exitCode = result.mode === 'executed' && result.overallOk ? 0 : 1
