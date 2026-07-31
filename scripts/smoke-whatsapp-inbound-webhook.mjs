/**
 * P2 Email/WhatsApp depth — thin WhatsApp inbound webhook smoke.
 *
 * Posts a fake WAHA-style payload to hosted /api/whatsapp/webhooks/message
 * and asserts CRM backlink returns contactId.
 *
 * Usage:
 *   CANONICAL_STAGING_BASE_URL=https://payaid-v3.vercel.app \
 *   CANONICAL_STAGING_TENANT_ID=cmjptk2mw0000aocw31u48n64 \
 *   WHATSAPP_WEBHOOK_SECRET=... (or SOCIAL_WEBHOOK_INGEST_SECRET) \
 *   node scripts/smoke-whatsapp-inbound-webhook.mjs
 *
 * If no webhook secret is configured on the host, omit secrets and the route
 * accepts unauthenticated posts (dev-style). Prefer secret in production.
 */
import { applyReleaseReadinessDefaults } from './release-readiness-defaults.mjs'

const env = applyReleaseReadinessDefaults(process.env)
const BASE = String(env.CANONICAL_STAGING_BASE_URL || '').replace(/\/$/, '')
const TENANT_ID =
  env.CANONICAL_STAGING_TENANT_ID ||
  env.TENANT_ID ||
  'cmjptk2mw0000aocw31u48n64'
const SECRET = env.WHATSAPP_WEBHOOK_SECRET || env.SOCIAL_WEBHOOK_INGEST_SECRET || ''

const out = {
  check: 'p2-whatsapp-inbound-webhook',
  baseUrl: BASE,
  tenantId: TENANT_ID,
  pass: false,
  steps: {},
}

if (!BASE) {
  out.error = 'CANONICAL_STAGING_BASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const phone = `+9198${String(Date.now()).slice(-8)}`
const messageId = `p2-wa-smoke-${Date.now()}`
const headers = { 'content-type': 'application/json' }
if (SECRET) {
  headers['x-payaid-webhook-secret'] = SECRET
}

const res = await fetch(`${BASE}/api/whatsapp/webhooks/message?tenantId=${encodeURIComponent(TENANT_ID)}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    tenantId: TENANT_ID,
    from: phone,
    pushName: 'P2 WA Smoke',
    id: messageId,
    body: 'P2 Email/WhatsApp depth inbound smoke',
  }),
})

let body = null
try {
  body = await res.json()
} catch {
  body = null
}

out.steps.webhook = {
  status: res.status,
  ok: body?.ok === true,
  contactId: body?.contactId || null,
  created: body?.created ?? null,
  skipped: body?.skipped || null,
  error: body?.error || null,
}

out.pass =
  res.status === 200 &&
  body?.ok === true &&
  Boolean(body?.contactId) &&
  !body?.skipped

if (!out.pass && res.status === 401) {
  out.blocker =
    'Host requires WHATSAPP_WEBHOOK_SECRET / SOCIAL_WEBHOOK_INGEST_SECRET — set matching local env and re-run.'
}

console.log(JSON.stringify(out, null, 2))
process.exit(out.pass ? 0 : 1)
