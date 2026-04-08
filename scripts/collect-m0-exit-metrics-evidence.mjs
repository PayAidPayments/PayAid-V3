import fs from 'node:fs'
import path from 'node:path'

const baseUrl = process.env.PAYAID_BASE_URL
const tenantId = process.env.PAYAID_TENANT_ID
const authToken = process.env.PAYAID_AUTH_TOKEN
const windowDays = process.env.M0_WINDOW_DAYS || '7'
const signalSample = process.env.M0_SIGNAL_SAMPLE || '100'
const outDir = process.env.M0_EVIDENCE_DIR || 'docs/evidence/m0-exit-metrics'

if (!baseUrl || !tenantId || !authToken) {
  process.stderr.write(
    'Missing required env vars: PAYAID_BASE_URL, PAYAID_TENANT_ID, PAYAID_AUTH_TOKEN.\n'
  )
  process.exit(1)
}

const now = new Date()
const stamp = now.toISOString().replace(/[:.]/g, '-')
const url = new URL('/api/v1/m0/exit-metrics', baseUrl)
url.searchParams.set('windowDays', String(windowDays))
url.searchParams.set('signalSample', String(signalSample))

const res = await fetch(url, {
  method: 'GET',
  headers: {
    authorization: `Bearer ${authToken}`,
    'x-tenant-id': tenantId,
  },
})

const text = await res.text()
let payload
try {
  payload = JSON.parse(text)
} catch {
  payload = { raw: text }
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${stamp}-${tenantId}.json`)
const body = {
  collected_at_utc: now.toISOString(),
  request: {
    url: url.toString(),
    tenant_id: tenantId,
    window_days: Number(windowDays),
    signal_sample: Number(signalSample),
  },
  response: {
    status: res.status,
    ok: res.ok,
    payload,
  },
}
fs.writeFileSync(outPath, `${JSON.stringify(body, null, 2)}\n`, 'utf8')

if (!res.ok) {
  process.stderr.write(`Evidence capture failed with status ${res.status}. Saved: ${outPath}\n`)
  process.exit(1)
}

process.stdout.write(`M0 exit evidence saved: ${outPath}\n`)
