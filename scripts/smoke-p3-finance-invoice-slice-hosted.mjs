/**
 * Hosted thin proof for P3 Finance invoice slice.
 * GET/POST /api/finance/invoices/slice
 *
 * No GST rebuild, no live send, no new payment gateway, no Voice/Appointments reopen.
 *
 * Usage: node scripts/smoke-p3-finance-invoice-slice-hosted.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const baseUrl = (
  process.env.CANONICAL_STAGING_BASE_URL ||
  process.env.APP_BASE_URL ||
  (() => {
    const raw = process.env.BASE_URL || ''
    if (/voice-rig|localhost|127\.0\.0\.1/i.test(raw)) return ''
    return raw
  })() ||
  'https://payaid-v3.vercel.app'
).replace(/\/$/, '')

const out = {
  ok: false,
  timestamp: iso,
  baseUrl,
  gates: {
    voiceStage4: 'frozen',
    appointments: 'frozen',
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
    paymentGateway: false,
    scope: 'thin-hosted-api-proof-only',
  },
  steps: {},
}

function getEnv(...keys) {
  for (const k of keys) {
    const v = process.env[k]
    if (v && String(v).trim()) return String(v).trim()
  }
  return ''
}

async function api(method, urlPath, { token, body } = {}) {
  const started = Date.now()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const res = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { ok: res.ok, status: res.status, durationMs: Date.now() - started, json, text }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      error: String(err?.message || err),
    }
  }
}

try {
  const email = getEnv('CRM_LOGIN_EMAIL', 'DEMO_LOGIN_EMAIL', 'LOGIN_EMAIL') || 'admin@demo.com'
  const password =
    getEnv('CRM_LOGIN_PASSWORD', 'DEMO_LOGIN_PASSWORD', 'LOGIN_PASSWORD') || 'Test@1234'

  const login = await api('POST', '/api/auth/login', { body: { email, password } })
  const token = login.json?.token || login.json?.accessToken || login.json?.authToken
  out.steps.login = {
    ok: login.ok && !!token,
    status: login.status,
    durationMs: login.durationMs,
  }
  if (!token) throw new Error(`login failed (${login.status})`)

  const getSlice = await api('GET', '/api/finance/invoices/slice?limit=5', { token })
  out.steps.getSlice = {
    ok: getSlice.ok && getSlice.json?.slice === 'p3-finance-invoice-smallest',
    status: getSlice.status,
    durationMs: getSlice.durationMs,
    bodySlice: (getSlice.text || '').slice(0, 180),
  }
  if (!out.steps.getSlice.ok) throw new Error(`GET slice failed (${getSlice.status})`)

  const create = await api('POST', '/api/finance/invoices/slice', {
    token,
    body: {
      customerName: `Hosted P3 Inv ${stamp.slice(0, 19)}`,
      customerEmail: `hosted-p3-inv-${Date.now()}@example.com`,
      amount: 1200,
      notes: 'Hosted P3 finance invoice slice',
    },
  })
  const invoiceId = create.json?.invoice?.id
  out.steps.create = {
    ok: create.status === 201 && create.json?.invoice?.status === 'draft' && !!invoiceId,
    status: create.status,
    durationMs: create.durationMs,
    invoiceId,
    customerId: create.json?.invoice?.customerId || null,
    paymentGateway: create.json?.paymentGateway === false,
    bodySlice: (create.text || '').slice(0, 220),
  }
  if (!out.steps.create.ok) throw new Error(`create failed (${create.status})`)

  const list = await api('GET', '/api/finance/invoices/slice?limit=20', { token })
  const listed = Array.isArray(list.json?.invoices)
    ? list.json.invoices.some((i) => i.id === invoiceId)
    : false
  out.steps.list = {
    ok: list.ok && listed,
    status: list.status,
    durationMs: list.durationMs,
  }
  if (!out.steps.list.ok) throw new Error('list missing created invoice')

  const issue = await api('POST', '/api/finance/invoices/slice', {
    token,
    body: { action: 'status', invoiceId, status: 'issued' },
  })
  out.steps.issue = {
    ok: issue.ok && issue.json?.invoice?.status === 'issued' && issue.json?.invoice?.dbStatus === 'sent',
    status: issue.status,
    durationMs: issue.durationMs,
  }
  if (!out.steps.issue.ok) throw new Error(`issue failed (${issue.status})`)

  const pay = await api('POST', '/api/finance/invoices/slice', {
    token,
    body: { action: 'status', invoiceId, status: 'paid' },
  })
  out.steps.markPaid = {
    ok:
      pay.ok &&
      pay.json?.invoice?.status === 'paid' &&
      !!pay.json?.invoice?.paidAt &&
      pay.json?.paymentGateway === false,
    status: pay.status,
    durationMs: pay.durationMs,
  }
  if (!out.steps.markPaid.ok) throw new Error(`mark-paid failed (${pay.status})`)

  // Cancel path on a second invoice
  const create2 = await api('POST', '/api/finance/invoices/slice', {
    token,
    body: { customerName: `Hosted P3 Cancel ${stamp.slice(0, 19)}`, amount: 200 },
  })
  const cancelId = create2.json?.invoice?.id
  const cancel = await api('POST', '/api/finance/invoices/slice', {
    token,
    body: { action: 'status', invoiceId: cancelId, status: 'cancelled' },
  })
  out.steps.cancel = {
    ok: cancel.ok && cancel.json?.invoice?.status === 'cancelled',
    status: cancel.status,
    durationMs: cancel.durationMs,
    invoiceId: cancelId,
  }
  if (!out.steps.cancel.ok) throw new Error(`cancel failed (${cancel.status})`)

  out.ok = true
} catch (err) {
  out.ok = false
  out.error = String(err?.message || err)
}

const evidenceDir = path.join(process.cwd(), 'docs', 'evidence', 'finance')
mkdirSync(evidenceDir, { recursive: true })
const evidencePath = path.join(evidenceDir, `${stamp}-p3-finance-invoice-slice-hosted-smoke.md`)
writeFileSync(
  evidencePath,
  [
    '# P3 Finance invoice slice — hosted smoke',
    '',
    `- timestamp: ${iso}`,
    `- baseUrl: ${baseUrl}`,
    `- ok: ${out.ok}`,
    '',
    '```json',
    JSON.stringify(out, null, 2),
    '```',
    '',
  ].join('\n'),
  'utf8'
)
out.evidencePath = evidencePath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
