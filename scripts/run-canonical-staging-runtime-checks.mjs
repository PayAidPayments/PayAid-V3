import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const BASE_URL = process.env.CANONICAL_STAGING_BASE_URL || ''
const AUTH_TOKEN = process.env.CANONICAL_STAGING_AUTH_TOKEN || ''
const INDUSTRY = process.env.CANONICAL_STAGING_INDUSTRY || 'retail'
const RUN_MUTATIONS = process.env.CANONICAL_STAGING_RUN_MUTATIONS === '1'

function headers(withJson = false) {
  const out = {}
  if (AUTH_TOKEN) out.Authorization = `Bearer ${AUTH_TOKEN}`
  if (withJson) out['Content-Type'] = 'application/json'
  return out
}

function topLevelKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return []
  return Object.keys(obj).sort()
}

function hasAll(keys, required) {
  return required.every((k) => keys.includes(k))
}

function hasNone(keys, forbidden) {
  return forbidden.every((k) => !keys.includes(k))
}

async function run() {
  const checks = []
  const blockedReasons = []

  if (!BASE_URL) blockedReasons.push('CANONICAL_STAGING_BASE_URL is missing')
  if (!AUTH_TOKEN) blockedReasons.push('CANONICAL_STAGING_AUTH_TOKEN is missing')

  if (blockedReasons.length > 0) {
    return {
      mode: 'blocked',
      blockedReasons,
      checks,
    }
  }

  async function getJson(url, init = {}) {
    const res = await fetch(url, init)
    const body = await res.json().catch(() => ({}))
    return { status: res.status, ok: res.ok, body, keys: topLevelKeys(body) }
  }

  // S1: GET /api/modules
  {
    const r = await getJson(`${BASE_URL}/api/modules`, { headers: headers() })
    const required = ['canonical', 'taxonomy']
    const forbidden = ['recommended', 'all', 'base', 'industry', 'compatibility']
    checks.push({
      id: 'S1',
      endpoint: 'GET /api/modules',
      status: r.status,
      pass: r.ok && hasAll(r.keys, required) && hasNone(r.keys, forbidden),
      keys: r.keys,
      required,
      forbidden,
    })
  }

  // S2: GET /api/industries/[industry]/modules
  {
    const r = await getJson(`${BASE_URL}/api/industries/${INDUSTRY}/modules`, { headers: headers() })
    const required = ['industry', 'canonical', 'suites', 'capabilities', 'optionalSuites']
    const forbidden = ['coreModules', 'industryPacks', 'optionalModules', 'compatibility']
    checks.push({
      id: 'S2',
      endpoint: 'GET /api/industries/[industry]/modules',
      status: r.status,
      pass: r.ok && hasAll(r.keys, required) && hasNone(r.keys, forbidden),
      keys: r.keys,
      required,
      forbidden,
    })
  }

  if (RUN_MUTATIONS) {
    // S3: POST /api/industries/[industry]/modules
    {
      const r = await getJson(`${BASE_URL}/api/industries/${INDUSTRY}/modules`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ industries: [INDUSTRY] }),
      })
      const required = ['success', 'canonical']
      const forbidden = ['enabledModules', 'enabledPacks', 'compatibility']
      checks.push({
        id: 'S3',
        endpoint: 'POST /api/industries/[industry]/modules',
        status: r.status,
        pass: r.ok && hasAll(r.keys, required) && hasNone(r.keys, forbidden),
        keys: r.keys,
        required,
        forbidden,
      })
    }

    // S4: POST /api/industries/custom/modules
    {
      const r = await getJson(`${BASE_URL}/api/industries/custom/modules`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({
          industryName: 'Canonical Check Industry',
          coreModules: ['crm', 'finance', 'ai-studio'],
          industryFeatures: ['sample_feature'],
        }),
      })
      const required = ['success', 'canonical', 'industryName']
      const forbidden = ['enabledModules', 'enabledFeatures', 'compatibility']
      checks.push({
        id: 'S4',
        endpoint: 'POST /api/industries/custom/modules',
        status: r.status,
        pass: r.ok && hasAll(r.keys, required) && hasNone(r.keys, forbidden),
        keys: r.keys,
        required,
        forbidden,
      })
    }

    // S5: POST /api/ai/analyze-industry
    {
      const r = await getJson(`${BASE_URL}/api/ai/analyze-industry`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ industryName: 'Retail' }),
      })
      const required = ['industryName', 'canonical', 'industryFeatures', 'description', 'keyProcesses']
      const forbidden = ['coreModules', 'compatibility']
      checks.push({
        id: 'S5',
        endpoint: 'POST /api/ai/analyze-industry',
        status: r.status,
        pass: r.ok && hasAll(r.keys, required) && hasNone(r.keys, forbidden),
        keys: r.keys,
        required,
        forbidden,
      })
    }
  } else {
    checks.push(
      { id: 'S3', endpoint: 'POST /api/industries/[industry]/modules', skipped: true, reason: 'RUN_MUTATIONS=0' },
      { id: 'S4', endpoint: 'POST /api/industries/custom/modules', skipped: true, reason: 'RUN_MUTATIONS=0' },
      { id: 'S5', endpoint: 'POST /api/ai/analyze-industry', skipped: true, reason: 'RUN_MUTATIONS=0' }
    )
  }

  const considered = checks.filter((c) => !c.skipped)
  const overallOk = considered.length > 0 && considered.every((c) => c.pass)
  return { mode: 'executed', overallOk, checks, runMutations: RUN_MUTATIONS, industry: INDUSTRY }
}

const result = await run()
const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-staging-runtime-checks.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-staging-runtime-checks.md`)

const payload = {
  check: 'canonical-staging-runtime-checks',
  timestamp: isoNow,
  baseUrl: BASE_URL || '[missing]',
  ...result,
}
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical staging runtime checks')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Base URL: ${BASE_URL || '[missing]'}`)
lines.push(`- Mode: ${result.mode}`)
if ('overallOk' in result) lines.push(`- Overall: ${result.overallOk ? 'pass' : 'fail'}`)
if (result.mode === 'blocked') {
  lines.push(`- Blockers: ${result.blockedReasons.join('; ')}`)
}
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Checks')
lines.push('')
for (const check of result.checks) {
  if (check.skipped) {
    lines.push(`- SKIPPED ${check.id} ${check.endpoint} (${check.reason})`)
  } else {
    lines.push(
      `- ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.endpoint} (status=${check.status}, keys=${(check.keys || []).join(', ')})`
    )
  }
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')
writeFileSync(mdPath, lines.join('\n'), 'utf8')

const overallOk = result.mode === 'executed' && result.overallOk === true
console.log(JSON.stringify({ overallOk, jsonPath, mdPath, mode: result.mode }, null, 2))
process.exitCode = overallOk ? 0 : 1
