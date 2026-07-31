/**
 * P2 live smoke: published sales-page POST → CRM contact (hosted dashboard twin).
 *
 * Usage:
 *   node scripts/smoke-p2-sales-pages-crm-live.mjs
 *   CANONICAL_STAGING_BASE_URL=https://payaid-v3.vercel.app node scripts/smoke-p2-sales-pages-crm-live.mjs
 *
 * Expects bridge-v2:
 *   compatibility.mode === 'landing-page-bridge-v2'
 *   contactId present
 *   crmSyncStatus === 'crm_synced'
 */
import { applyReleaseReadinessDefaults } from './release-readiness-defaults.mjs'

const env = applyReleaseReadinessDefaults(process.env)
const BASE = String(env.CANONICAL_STAGING_BASE_URL || '').replace(/\/$/, '')
const EMAIL = env.CANONICAL_STAGING_LOGIN_EMAIL || 'admin@demo.com'
const PASSWORD = env.CANONICAL_STAGING_LOGIN_PASSWORD || env.TEST_PASSWORD || 'Test@1234'

async function json(url, init) {
  const res = await fetch(url, init)
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, ok: res.ok, body }
}

const out = {
  check: 'p2-sales-pages-crm-live',
  baseUrl: BASE,
  pass: false,
  steps: {},
}

if (!BASE) {
  out.error = 'CANONICAL_STAGING_BASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const login = await json(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
out.steps.login = { status: login.status, hasToken: Boolean(login.body?.token) }
const token = login.body?.token
if (!token) {
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const pages = await json(`${BASE}/api/sales-pages?status=PUBLISHED`, {
  headers: { Authorization: `Bearer ${token}` },
})
const page = (pages.body?.pages || [])[0]
out.steps.listPublished = {
  status: pages.status,
  count: (pages.body?.pages || []).length,
  pageId: page?.id || null,
  slug: page?.slug || null,
}
if (!page?.id) {
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const email = `p2-live-${Date.now()}@example.com`
const submit = await json(`${BASE}/api/sales-submissions`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    salesPageId: page.id,
    formId: 'p2-live-smoke',
    payload: { name: 'P2 Live Qualify', email, phone: '+919888777666' },
    attribution: { source: 'p2-live-smoke', medium: 'script', campaign: 'qualify-loop' },
    ctaEvent: { type: 'form_submit' },
  }),
})
out.steps.submit = {
  status: submit.status,
  mode: submit.body?.compatibility?.mode || null,
  contactId: submit.body?.contactId || null,
  crmSyncStatus: submit.body?.crmSyncStatus || null,
  entryId: submit.body?.entryId || null,
  stubQueued: submit.body?.crmSync === 'queued',
}

const list = await json(`${BASE}/api/sales-submissions?limit=20`, {
  headers: { Authorization: `Bearer ${token}` },
})
const listed = (list.body?.submissions || []).find(
  (row) => row.entryId === submit.body?.entryId || row.id === submit.body?.entryId || row.contactId === submit.body?.contactId
)
out.steps.listSubmissions = {
  status: list.status,
  count: (list.body?.submissions || []).length,
  foundSubmitted: Boolean(listed),
  foundCrmStatus: listed?.crmSyncStatus || null,
}

out.pass =
  submit.status === 202 &&
  submit.body?.compatibility?.mode === 'landing-page-bridge-v2' &&
  Boolean(submit.body?.contactId) &&
  submit.body?.crmSyncStatus === 'crm_synced' &&
  !submit.body?.crmSync &&
  list.status === 200 &&
  Boolean(listed)

if (!out.pass && submit.body?.compatibility?.mode === 'landing-page-bridge') {
  out.blocker =
    'Hosted /api/sales-submissions still serves landing-page-bridge stub. Deploy bridge-v2 (dashboard twin) then re-run.'
}

console.log(JSON.stringify(out, null, 2))
process.exit(out.pass ? 0 : 1)
