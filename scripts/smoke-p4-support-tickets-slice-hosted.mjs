/**
 * Hosted thin proof for P4 Support tickets slice.
 * GET/POST /api/support/tickets/slice
 *
 * No live send, no Finance/Projects/Voice/Appointments reopen.
 *
 * Usage: node scripts/smoke-p4-support-tickets-slice-hosted.mjs
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
    finance: 'closed',
    projects: 'closed',
    appointments: 'frozen',
    voiceStage4: 'frozen',
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
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
  out.steps.login = { ok: login.ok && !!token, status: login.status, durationMs: login.durationMs }
  if (!token) throw new Error(`login failed (${login.status})`)

  const getSlice = await api('GET', '/api/support/tickets/slice?limit=5', { token })
  out.steps.getSlice = {
    ok: getSlice.ok && getSlice.json?.slice === 'p4-support-tickets-smallest',
    status: getSlice.status,
    durationMs: getSlice.durationMs,
    bodySlice: (getSlice.text || '').slice(0, 180),
  }
  if (!out.steps.getSlice.ok) throw new Error(`GET slice failed (${getSlice.status}): ${(getSlice.text || '').slice(0, 200)}`)

  const create = await api('POST', '/api/support/tickets/slice', {
    token,
    body: {
      subject: `Hosted P4 Ticket ${stamp.slice(0, 19)}`,
      description: 'Hosted P4 support tickets slice',
    },
  })
  const ticketId = create.json?.ticket?.id
  out.steps.create = {
    ok: create.status === 201 && create.json?.ticket?.status === 'new' && !!ticketId,
    status: create.status,
    durationMs: create.durationMs,
    ticketId,
    contactId: create.json?.ticket?.contactId || null,
    bodySlice: (create.text || '').slice(0, 220),
  }
  if (!out.steps.create.ok) throw new Error(`create failed (${create.status}): ${(create.text || '').slice(0, 200)}`)

  const list = await api('GET', '/api/support/tickets/slice?limit=20', { token })
  const listed = Array.isArray(list.json?.tickets)
    ? list.json.tickets.some((t) => t.id === ticketId)
    : false
  out.steps.list = { ok: list.ok && listed, status: list.status, durationMs: list.durationMs }
  if (!out.steps.list.ok) throw new Error('list missing created ticket')

  const open = await api('POST', '/api/support/tickets/slice', {
    token,
    body: { action: 'status', ticketId, status: 'open' },
  })
  out.steps.open = {
    ok: open.ok && open.json?.ticket?.status === 'open',
    status: open.status,
    durationMs: open.durationMs,
  }
  if (!out.steps.open.ok) throw new Error(`open failed (${open.status})`)

  const resolve = await api('POST', '/api/support/tickets/slice', {
    token,
    body: { action: 'status', ticketId, status: 'resolved' },
  })
  out.steps.resolve = {
    ok: resolve.ok && resolve.json?.ticket?.status === 'resolved',
    status: resolve.status,
    durationMs: resolve.durationMs,
  }
  if (!out.steps.resolve.ok) throw new Error(`resolve failed (${resolve.status})`)

  const create2 = await api('POST', '/api/support/tickets/slice', {
    token,
    body: { subject: `Hosted P4 Close ${stamp.slice(0, 19)}` },
  })
  const closeId = create2.json?.ticket?.id
  const close = await api('POST', '/api/support/tickets/slice', {
    token,
    body: { action: 'status', ticketId: closeId, status: 'closed' },
  })
  out.steps.close = {
    ok: close.ok && close.json?.ticket?.status === 'closed',
    status: close.status,
    durationMs: close.durationMs,
    ticketId: closeId,
  }
  if (!out.steps.close.ok) throw new Error(`close failed (${close.status})`)

  out.ok = true
} catch (err) {
  out.error = String(err?.message || err)
}

const dir = path.join(process.cwd(), 'docs/evidence/support')
mkdirSync(dir, { recursive: true })
const evidencePath = path.join(dir, `${stamp}-p4-support-tickets-slice-hosted-smoke.md`)
writeFileSync(
  evidencePath,
  `# P4 Support tickets slice — hosted smoke\n\n- timestamp: ${iso}\n- baseUrl: ${baseUrl}\n- ok: ${out.ok}\n\n\`\`\`json\n${JSON.stringify(out, null, 2)}\n\`\`\`\n`
)
out.evidencePath = evidencePath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
