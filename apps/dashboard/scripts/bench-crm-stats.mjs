/**
 * CRM dashboard stats latency (median of N runs).
 *
 * Usage:
 *   node scripts/bench-crm-stats.mjs
 *   BENCH_BASE_URL=http://localhost:3000 BENCH_TOKEN=eyJ... BENCH_TENANT=uuid node scripts/bench-crm-stats.mjs
 *
 * Without BENCH_TOKEN: only hits /api/health/db (no auth).
 */
const base = (process.env.BENCH_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const token = process.env.BENCH_TOKEN || ''
const tenant = process.env.BENCH_TENANT || ''
const runs = Math.max(3, parseInt(process.env.BENCH_RUNS || '5', 10) || 5)

async function timeOnce(url, headers = {}) {
  const t0 = performance.now()
  const res = await fetch(url, { headers })
  const buf = await res.arrayBuffer()
  const ms = performance.now() - t0
  return { ms, ok: res.ok, status: res.status, bytes: buf.byteLength }
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

async function bench(label, path, authHeaders) {
  const times = []
  for (let i = 0; i < runs; i++) {
    const r = await timeOnce(`${base}${path}`, authHeaders)
    if (!r.ok && i === 0) {
      console.error(`  first ${label} failed: HTTP ${r.status}`)
    }
    times.push(r.ms)
  }
  const med = median(times)
  const min = Math.min(...times)
  const max = Math.max(...times)
  console.log(`${label}: median ${med.toFixed(0)}ms  min ${min.toFixed(0)}ms  max ${max.toFixed(0)}ms  (${runs} runs)`)
  return med
}

async function main() {
  console.log(`Base: ${base}\n`)

  const db = await timeOnce(`${base}/api/health/db`)
  console.log(`health/db: ${db.ms.toFixed(0)}ms HTTP ${db.status} ${db.ok ? 'ok' : 'FAIL'}\n`)

  if (!token) {
    console.log('Set BENCH_TOKEN (Bearer JWT) and optional BENCH_TENANT to benchmark stats endpoints.')
    process.exit(db.ok ? 0 : 1)
  }

  const auth = { Authorization: `Bearer ${token}` }
  const tq = tenant ? `&tenantId=${encodeURIComponent(tenant)}` : ''

  await bench('stats lite', `/api/crm/dashboard/stats?period=month&lite=1${tq}`, auth)
  await bench('stats chartsOnly', `/api/crm/dashboard/stats?period=month&lite=0&chartsOnly=1${tq}`, auth)
  await bench('stats full (no chartsOnly)', `/api/crm/dashboard/stats?period=month&lite=0${tq}`, auth)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
