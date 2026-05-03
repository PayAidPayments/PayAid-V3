/**
 * Sample authenticated p50/p95 for CRM list APIs (local or staging).
 * Does not print the token. Copy results into docs/LAUNCH_CHECKLIST.md Speed evidence log.
 *
 * Usage (PowerShell example):
 *   $env:BASE_URL="http://localhost:3000"
 *   $env:TENANT_ID="your_tenant_id"
 *   $env:AUTH_TOKEN="your_jwt"
 *   node scripts/crm-auth-speed-sample.mjs
 */

const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const tenantId = process.env.TENANT_ID || ''
const token = process.env.AUTH_TOKEN || ''
const requestTimeoutMs = Number(process.env.CRM_AUTH_SAMPLE_TIMEOUT_MS || '60000')
const sampleCount = Number(process.env.CRM_AUTH_SAMPLE_COUNT || '25')

if (!tenantId || !token) {
  console.error('Set TENANT_ID and AUTH_TOKEN (and optional BASE_URL).')
  process.exit(1)
}

function percentile(sorted, p) {
  const idx = Math.ceil(p * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

async function sample(path, n = sampleCount) {
  const times = []
  const headers = { Authorization: `Bearer ${token}` }
  for (let i = 0; i < n; i++) {
    const t0 = performance.now()
    const r = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(requestTimeoutMs) })
    await r.arrayBuffer()
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  return {
    p50_ms: Math.round(percentile(times, 0.5)),
    p95_ms: Math.round(percentile(times, 0.95)),
    min_ms: Math.round(times[0]),
    max_ms: Math.round(times[times.length - 1]),
  }
}

const enc = encodeURIComponent(tenantId)
const paths = [
  [`/api/contacts?tenantId=${enc}&limit=50`, 'contacts'],
  [`/api/deals?tenantId=${enc}&limit=50`, 'deals'],
  [`/api/tasks?tenantId=${enc}&limit=50&stats=false`, 'tasks'],
]

;(async () => {
  const out = {}
  for (const [path, name] of paths) {
    const r0 = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(requestTimeoutMs),
    })
    out[name] = { first_status: r0.status, ...(await sample(path)) }
  }
  console.log(JSON.stringify({ base, tenantId, samples: sampleCount, requestTimeoutMs, ...out }, null, 2))
  console.log('\nAdd p95_ms values as a new row in docs/LAUNCH_CHECKLIST.md → Speed evidence log.')
})().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
