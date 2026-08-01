/**
 * Hosted thin proof for P2 Appointments smallest slice.
 * GET/POST /api/appointments/slice + GET /api/crm/contacts/[id]/appointments
 *
 * No calendar UI, no live reminder send, no Voice Stage 4.
 *
 * Usage: node scripts/smoke-p2-appointments-slice-hosted.mjs
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
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
    scope: 'thin-hosted-proof-only',
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
      signal: AbortSignal.timeout(45000),
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      json,
      text: text.slice(0, 800),
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      json: null,
      text: error instanceof Error ? error.message : String(error),
    }
  }
}

try {
  const email =
    getEnv(
      'CANONICAL_STAGING_LOGIN_EMAIL',
      'LOGIN_EMAIL',
      'PERF_TEST_EMAIL',
      'DEMO_ADMIN_EMAIL'
    ) || 'admin@demo.com'
  const password =
    getEnv(
      'CANONICAL_STAGING_LOGIN_PASSWORD',
      'LOGIN_PASSWORD',
      'PERF_TEST_PASSWORD',
      'DEMO_ADMIN_PASSWORD'
    ) || 'Test@1234'

  const login = await api('POST', '/api/auth/login', {
    body: { email, password },
  })
  const token = login.json?.token || login.json?.accessToken || ''
  out.steps.login = { ok: Boolean(login.ok && token), status: login.status, durationMs: login.durationMs }
  if (!token) throw new Error('Login failed; no token')

  const listEmpty = await api('GET', '/api/appointments/slice?limit=5', { token })
  out.steps.getSlice = {
    ok: Boolean(listEmpty.ok && listEmpty.json?.ok === true && listEmpty.json?.slice === 'p2-appointments-smallest'),
    status: listEmpty.status,
    durationMs: listEmpty.durationMs,
    bodySlice: listEmpty.text.slice(0, 240),
  }
  if (!out.steps.getSlice.ok) {
    throw new Error(`GET /api/appointments/slice failed: ${listEmpty.status} ${listEmpty.text.slice(0, 200)}`)
  }

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(10, 0, 0, 0)
  const create = await api('POST', '/api/appointments/slice', {
    token,
    body: {
      contactName: `Hosted P2 Appt ${stamp.slice(0, 19)}`,
      contactEmail: `hosted-p2-appt-${Date.now()}@example.com`,
      appointmentDate: tomorrow.toISOString(),
      startTime: '11:15',
      duration: 30,
      notes: 'Hosted thin proof — draft reminder only',
      reminderMinutesBefore: 60,
    },
  })
  const appointment = create.json?.appointment
  out.steps.create = {
    ok: Boolean(
      create.ok &&
        appointment?.id &&
        appointment?.contactId &&
        appointment?.status === 'pending' &&
        create.json?.reminderHook?.sent === false
    ),
    status: create.status,
    durationMs: create.durationMs,
    appointmentId: appointment?.id || null,
    contactId: appointment?.contactId || null,
    reminderStatus: appointment?.reminder?.status || create.json?.reminderHook?.status || null,
    reminderSent: create.json?.reminderHook?.sent ?? null,
    bodySlice: create.text.slice(0, 400),
  }
  if (!out.steps.create.ok) {
    throw new Error(`POST create failed: ${create.status} ${create.text.slice(0, 300)}`)
  }

  const listAfter = await api(
    'GET',
    `/api/appointments/slice?contactId=${encodeURIComponent(appointment.contactId)}&limit=20`,
    { token }
  )
  const listed = Array.isArray(listAfter.json?.appointments)
    ? listAfter.json.appointments.some((a) => a.id === appointment.id)
    : false
  out.steps.listUpcoming = {
    ok: Boolean(listAfter.ok && listed),
    status: listAfter.status,
    durationMs: listAfter.durationMs,
  }

  const confirm = await api('POST', '/api/appointments/slice', {
    token,
    body: { action: 'status', appointmentId: appointment.id, status: 'confirmed' },
  })
  out.steps.confirm = {
    ok: Boolean(confirm.ok && confirm.json?.appointment?.status === 'confirmed'),
    status: confirm.status,
    durationMs: confirm.durationMs,
  }

  const crmList = await api(
    'GET',
    `/api/crm/contacts/${encodeURIComponent(appointment.contactId)}/appointments`,
    { token }
  )
  out.steps.crmContactAppointments = {
    ok: Boolean(crmList.ok && crmList.json?.ok === true && crmList.json?.contact?.id === appointment.contactId),
    status: crmList.status,
    durationMs: crmList.durationMs,
    upcomingCount: Array.isArray(crmList.json?.upcoming) ? crmList.json.upcoming.length : null,
    bodySlice: crmList.text.slice(0, 300),
  }

  // Complete to leave a clean terminal state (no live send)
  const complete = await api('POST', '/api/appointments/slice', {
    token,
    body: { action: 'status', appointmentId: appointment.id, status: 'completed' },
  })
  out.steps.complete = {
    ok: Boolean(complete.ok && complete.json?.appointment?.status === 'completed'),
    status: complete.status,
    durationMs: complete.durationMs,
  }

  out.ok = Boolean(
    out.steps.login.ok &&
      out.steps.getSlice.ok &&
      out.steps.create.ok &&
      out.steps.listUpcoming.ok &&
      out.steps.confirm.ok &&
      out.steps.crmContactAppointments.ok &&
      out.steps.complete.ok
  )
} catch (error) {
  out.error = error instanceof Error ? error.message : String(error)
}

const dir = path.join(process.cwd(), 'docs', 'evidence', 'appointments')
mkdirSync(dir, { recursive: true })
const mdPath = path.join(dir, `${stamp}-p2-appointments-slice-hosted-smoke.md`)
writeFileSync(
  mdPath,
  [
    '# P2 Appointments — hosted thin proof',
    '',
    `- Timestamp: ${iso}`,
    `- Pass: ${out.ok ? 'yes' : 'no'}`,
    `- BASE_URL: ${baseUrl}`,
    '',
    '## Gates',
    '',
    `- Voice Stage 4: ${out.gates.voiceStage4}`,
    `- Email/WhatsApp: ${out.gates.emailWhatsapp}`,
    `- bridge-v2: ${out.gates.bridgeV2}`,
    `- LI: ${out.gates.leadIntelligence}`,
    `- migrations: ${out.gates.migrations}`,
    `- scope: ${out.gates.scope}`,
    '',
    '## Steps',
    '',
    '```json',
    JSON.stringify(out.steps, null, 2),
    '```',
    '',
    out.error ? `## Error\n\n${out.error}\n` : '',
  ].join('\n'),
  'utf8'
)
out.evidencePath = mdPath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
