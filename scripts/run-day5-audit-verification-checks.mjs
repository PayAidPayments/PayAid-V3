import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'https://payaid-v3.vercel.app'
const ADMIN_EMAIL = process.env.CRM_LOGIN_EMAIL || 'businessadmin@demobusiness.com'
const ADMIN_PASSWORD = process.env.CRM_LOGIN_PASSWORD || 'BusinessAdmin_2025!'
const SALES_EMAIL = process.env.DAY5_SALES_EMAIL || 'rohan.kapoor@demobusiness.com'
const SALES_PASSWORD = process.env.DAY5_SALES_PASSWORD || 'Test@1234'
const REQUEST_TIMEOUT_MS = Number(process.env.DAY5_AUDIT_REQUEST_TIMEOUT_MS || 30000)

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function requestJson(url, options = {}) {
  const res = await fetchWithTimeout(url, options)
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { res, text, json }
}

async function login(email, password) {
  const { res, json, text } = await requestJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok || !json?.token) {
    throw new Error(`Login failed (${email}): ${res.status} ${text.slice(0, 160)}`)
  }
  return json
}

async function createTempContact(token, tenantId, nameSuffix) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  const body = {
    name: `Day5 Audit ${nameSuffix} ${unique}`,
    email: `day5.audit.${nameSuffix.toLowerCase()}.${unique}@example.com`,
    phone: `+91-90000${Math.floor(Math.random() * 90000 + 10000)}`,
    company: 'Day5 Audit Co',
    type: 'lead',
    stage: 'prospect',
  }
  const { res, json, text } = await requestJson(`${BASE_URL}/api/contacts?tenantId=${tenantId}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Create temp contact failed: ${res.status} ${text.slice(0, 160)}`)
  }
  return json?.id || json?.data?.id
}

async function run() {
  const startedAt = new Date().toISOString()

  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD)
  const sales = await login(SALES_EMAIL, SALES_PASSWORD)

  const token = admin.token
  const tenantId = admin?.tenant?.id || admin?.user?.tenantId
  const adminUserId = admin?.user?.id
  const salesUserId = sales?.user?.id

  if (!tenantId || !adminUserId || !salesUserId) {
    throw new Error('Missing tenant/user context from login payload')
  }

  const c1 = await createTempContact(token, tenantId, 'C1')
  const c2 = await createTempContact(token, tenantId, 'C2')
  const c3 = await createTempContact(token, tenantId, 'C3')
  const c4 = await createTempContact(token, tenantId, 'C4')

  const calls = []
  async function call(id, method, pathName, body) {
    const { res, text } = await requestJson(`${BASE_URL}${pathName}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    calls.push({
      id,
      method,
      path: pathName,
      status: res.status,
      bodyExcerpt: text.slice(0, 200).replace(/\s+/g, ' '),
    })
  }

  await call('A1', 'POST', '/api/tasks/bulk-complete', { ids: ['day5-audit-task-id'] })
  await call('A2', 'POST', '/api/crm/contacts/bulk-delete', { contactIds: [c1] })
  await call('A3', 'DELETE', `/api/contacts/${c4}?tenantId=${tenantId}`)
  await call('A4', 'POST', '/api/crm/contacts/mass-transfer', {
    contactIds: [c2],
    assignToUserId: salesUserId,
  })
  await call('A5', 'POST', '/api/crm/leads/mass-transfer', {
    leadIds: [c3],
    assignToUserId: salesUserId,
  })
  await call('A6', 'POST', '/api/crm/leads/mass-delete', { leadIds: [c3] })
  await call('A7', 'POST', '/api/crm/leads/mass-update', {
    leadIds: [c2],
    updates: { stage: 'contact' },
  })

  const logsRes = await requestJson(`${BASE_URL}/api/audit-logs?limit=200`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const logs = Array.isArray(logsRes.json?.logs) ? logsRes.json.logs : []
  const summaries = logs.map((l) => String(l.changeSummary || ''))

  const expectations = {
    A1: /Bulk completed/i,
    A2: /Bulk archived/i,
    A3: /Contact deleted/i,
    A4: /Mass transferred .*contact/i,
    A5: /Mass transferred .*lead/i,
    A6: /Mass deleted .*lead/i,
    A7: /Mass updated .*lead/i,
  }

  const auditChecks = Object.entries(expectations).map(([id, regex]) => {
    const found = summaries.some((s) => regex.test(s))
    return { id, found, pattern: String(regex) }
  })

  const passCount = auditChecks.filter((c) => c.found).length
  const failCount = auditChecks.length - passCount

  const payload = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    tenantId,
    users: {
      admin: { email: ADMIN_EMAIL, userId: adminUserId },
      sales: { email: SALES_EMAIL, userId: salesUserId },
    },
    tempContacts: { c1, c2, c3, c4 },
    calls,
    auditLogFetch: {
      status: logsRes.res.status,
      logCount: logs.length,
    },
    auditChecks,
    summary: {
      pass: passCount,
      fail: failCount,
    },
  }

  const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${nowStamp()}-crm-day5-audit-verification-automation.json`)
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(
    JSON.stringify(
      {
        ok: failCount === 0,
        outPath: outPath.replaceAll('\\', '/'),
        pass: passCount,
        fail: failCount,
      },
      null,
      2
    )
  )
  if (failCount > 0) process.exit(2)
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
})
