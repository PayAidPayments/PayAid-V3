import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const BASE_URL = (process.env.CANONICAL_STAGING_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '')
const LOGIN_EMAIL = process.env.CANONICAL_STAGING_LOGIN_EMAIL || 'admin@demo.com'
const LOGIN_PASSWORD = process.env.CANONICAL_STAGING_LOGIN_PASSWORD || process.env.TEST_PASSWORD || 'Test@1234'
const BEARER_TOKEN = process.env.CANONICAL_STAGING_AUTH_TOKEN || ''
const INDUSTRY = process.env.CANONICAL_STAGING_INDUSTRY || 'retail'

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
  return { status: res.status, ok: res.ok, body, keys: topLevelKeys(body) }
}

async function requestText(url, init = {}) {
  const res = await fetch(url, init)
  const text = await res.text()
  return { status: res.status, ok: res.ok, text }
}

function hasAll(keys, required) {
  return required.every((k) => keys.includes(k))
}

function hasNone(keys, forbidden) {
  return forbidden.every((k) => !keys.includes(k))
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
  const token = tokenResult.token
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  // UI surface checks (route availability + no server exception overlay)
  const uiRoutes = ['/dashboard/modules', `/industries/${INDUSTRY}`, '/signup']
  for (const route of uiRoutes) {
    const r = await requestText(`${BASE_URL}${route}`)
    const hasOverlay = r.text.includes('Application error: a server-side exception')
    checks.push({
      id: `UI:${route}`,
      type: 'ui',
      route,
      status: r.status,
      pass: r.status !== 404 && r.status !== 500 && !hasOverlay,
      overlay: hasOverlay,
    })
  }

  // Authenticated canonical API checks mapped to UI surfaces
  const apiChecks = [
    {
      id: 'API:modules',
      endpoint: '/api/modules',
      method: 'GET',
      required: ['canonical', 'taxonomy'],
      forbidden: ['recommended', 'all', 'base', 'industry', 'compatibility'],
    },
    {
      id: 'API:industry-modules',
      endpoint: `/api/industries/${INDUSTRY}/modules`,
      method: 'GET',
      required: ['industry', 'canonical', 'suites', 'capabilities', 'optionalSuites'],
      forbidden: ['coreModules', 'industryPacks', 'optionalModules', 'compatibility'],
    },
    {
      id: 'API:custom-industry',
      endpoint: '/api/industries/custom/modules',
      method: 'POST',
      body: { industryName: 'Canonical Smoke Industry', coreModules: ['crm'], industryFeatures: [] },
      required: ['success', 'canonical', 'industryName'],
      forbidden: ['enabledModules', 'enabledFeatures', 'compatibility'],
    },
    {
      id: 'API:analyze-industry',
      endpoint: '/api/ai/analyze-industry',
      method: 'POST',
      body: { industryName: 'Retail' },
      required: ['industryName', 'canonical', 'industryFeatures', 'description', 'keyProcesses'],
      forbidden: ['coreModules', 'compatibility'],
    },
  ]

  for (const c of apiChecks) {
    const init = {
      method: c.method,
      headers: { ...authHeaders, ...(c.body ? { 'content-type': 'application/json' } : {}) },
      ...(c.body ? { body: JSON.stringify(c.body) } : {}),
    }
    const r = await requestJson(`${BASE_URL}${c.endpoint}`, init)
    checks.push({
      id: c.id,
      type: 'api',
      endpoint: c.endpoint,
      status: r.status,
      pass: r.ok && hasAll(r.keys, c.required) && hasNone(r.keys, c.forbidden),
      keys: r.keys,
      required: c.required,
      forbidden: c.forbidden,
    })
  }

  const overallOk = checks.every((c) => c.pass)
  return {
    mode: 'executed',
    overallOk,
    checks,
    tokenSource: tokenResult.source,
    tokenAvailable: Boolean(token),
    loginStatus: tokenResult.loginStatus ?? null,
  }
}

const result = await run()
const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-ui-surface-smoke.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-ui-surface-smoke.md`)

const payload = {
  check: 'canonical-ui-surface-smoke',
  timestamp: isoNow,
  baseUrl: BASE_URL || '[missing]',
  ...result,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical UI surface smoke')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Base URL: ${BASE_URL || '[missing]'}`)
lines.push(`- Mode: ${result.mode}`)
if ('overallOk' in result) lines.push(`- Overall: ${result.overallOk ? 'pass' : 'fail'}`)
if ('tokenSource' in result) lines.push(`- Auth token source: ${result.tokenSource}`)
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
