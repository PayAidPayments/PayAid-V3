/**
 * Assurance staging probes (A0 token denial + finance P0 routes).
 * Usage:
 *   CANONICAL_STAGING_BASE_URL=https://payaid-v3.vercel.app node scripts/assurance-staging-probe.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const base = (process.env.CANONICAL_STAGING_BASE_URL || '').replace(/\/$/, '')
const token = process.env.CANONICAL_STAGING_AUTH_TOKEN || ''

const probes = [
  { id: 'A0-deny-deals', url: '/api/crm/deals', expectUnauth: [401, 403] },
  { id: 'A0-deny-invoices', url: '/api/billing/invoices', expectUnauth: [401, 403] },
  {
    id: 'A1-deny-expenses',
    url: '/api/finance/expenses?organizationId=00000000-0000-0000-0000-000000000001',
    expectUnauth: [401, 403],
  },
  {
    id: 'A1-deny-gst-returns',
    url: '/api/finance/gst-returns?organizationId=00000000-0000-0000-0000-000000000001',
    expectUnauth: [401, 403],
  },
  { id: 'A1-deny-gst-search', url: '/api/gst/search?q=test', expectUnauth: [401, 403] },
]

async function fetchStatus(url, auth = false) {
  const headers = auth && token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${base}${url}`, { headers })
  return res.status
}

async function main() {
  if (!base) {
    console.log(JSON.stringify({ ok: false, error: 'CANONICAL_STAGING_BASE_URL required' }, null, 2))
    process.exit(1)
  }

  const results = []
  for (const p of probes) {
    const unauth = await fetchStatus(p.url, false)
    const row = {
      id: p.id,
      url: p.url,
      unauthStatus: unauth,
      unauthPass: p.expectUnauth.includes(unauth),
    }
    if (token) {
      row.authStatus = await fetchStatus(p.url, true)
    }
    results.push(row)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join('docs', 'evidence', 'assurance')
  mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${stamp}-staging-probe.json`)
  const payload = {
    collectedAt: new Date().toISOString(),
    base,
    hasToken: Boolean(token),
    results,
    overallPass: results.every((r) => r.unauthPass),
  }
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(JSON.stringify({ ...payload, outPath }, null, 2))
  process.exit(payload.overallPass ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
