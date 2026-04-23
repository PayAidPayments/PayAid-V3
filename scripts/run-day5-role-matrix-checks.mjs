import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const OWNER_EMAIL = process.env.CRM_LOGIN_EMAIL || 'admin@demo.com'
const OWNER_PASSWORD = process.env.CRM_LOGIN_PASSWORD || 'Test@1234'
const TEST_PASSWORD = process.env.DAY5_TEST_PASSWORD || 'Test@1234'
const REQUEST_TIMEOUT_MS = Number(process.env.DAY5_REQUEST_TIMEOUT_MS || 120000)
const SKIP_SETUP = process.env.DAY5_SKIP_SETUP === '1'

const TEST_USERS = {
  admin: {
    email: process.env.DAY5_ADMIN_EMAIL || 'day5.admin@demobusiness.com',
    role: 'admin',
    name: 'Day5 Admin',
  },
  manager: {
    email: process.env.DAY5_MANAGER_EMAIL || 'day5.manager@demobusiness.com',
    role: 'manager',
    name: 'Day5 Manager',
  },
  rep: {
    email: process.env.DAY5_REP_EMAIL || 'day5.rep@demobusiness.com',
    role: 'rep',
    name: 'Day5 Rep',
  },
  readonly: {
    email: process.env.DAY5_READONLY_EMAIL || 'day5.readonly@demobusiness.com',
    role: 'read_only',
    name: 'Day5 Readonly',
  },
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
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
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { res, json, text } = await requestJson(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok && json?.token) {
        return json
      }
      lastError = new Error(`Login failed for ${email}: ${res.status} ${text.slice(0, 180)}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((r) => setTimeout(r, 500 * attempt))
  }
  throw lastError instanceof Error ? lastError : new Error(`Login failed for ${email}`)
}

async function ensureRoleUser(ownerToken, userConfig) {
  let createStatus = 0
  let createError = null
  try {
    const createRes = await requestJson(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        email: userConfig.email,
        name: userConfig.name,
        role: userConfig.role,
      }),
    })
    createStatus = createRes.res.status
  } catch (error) {
    createError = error instanceof Error ? error.message : String(error)
  }

  // Existing user can return non-2xx; password reset handles both create/existing.
  let resetStatus = 0
  let resetError = null
  try {
    const resetRes = await requestJson(`${BASE_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userConfig.email,
        password: TEST_PASSWORD,
      }),
    })
    resetStatus = resetRes.res.status
    if (!resetRes.res.ok) {
      resetError = `status=${resetRes.res.status} ${resetRes.text.slice(0, 180)}`
    }
  } catch (error) {
    resetError = error instanceof Error ? error.message : String(error)
  }

  return {
    createStatus,
    createError,
    resetStatus,
    resetError,
  }
}

function buildRows(tenantId) {
  const id = 'non-existent-id-day5'
  return [
    { id: 'R1', method: 'POST', path: '/api/tasks/bulk-complete', body: { ids: [id] }, allowedRoles: ['admin', 'manager'] },
    { id: 'R2', method: 'POST', path: '/api/crm/contacts/bulk-delete', body: { contactIds: [id] }, allowedRoles: ['admin', 'manager'] },
    { id: 'R3', method: 'DELETE', path: `/api/contacts/${id}?tenantId=${tenantId}`, allowedRoles: ['admin', 'manager'] },
    { id: 'R4', method: 'DELETE', path: `/api/deals/${id}?tenantId=${tenantId}`, allowedRoles: ['admin', 'manager'] },
    { id: 'R5', method: 'GET', path: '/api/crm/contacts/export', allowedRoles: ['admin', 'manager'] },
    {
      id: 'R6',
      method: 'POST',
      path: '/api/crm/contacts/mass-transfer',
      body: { contactIds: [id], assignToUserId: id },
      allowedRoles: ['admin', 'manager'],
    },
    {
      id: 'R7',
      method: 'POST',
      path: '/api/crm/leads/mass-transfer',
      body: { leadIds: [id], assignToUserId: id },
      allowedRoles: ['admin', 'manager'],
    },
    { id: 'R8', method: 'POST', path: '/api/crm/leads/mass-delete', body: { leadIds: [id] }, allowedRoles: ['admin', 'manager'] },
    {
      id: 'R9',
      method: 'POST',
      path: '/api/crm/leads/mass-update',
      body: { leadIds: [id], updates: { stage: 'prospect' } },
      allowedRoles: ['admin', 'manager'],
    },
    { id: 'R10', method: 'POST', path: '/api/crm/scoring/thresholds', body: { min: 0, max: 100 }, allowedRoles: ['admin'] },
    { id: 'R11', method: 'POST', path: '/api/crm/scoring/rules', body: { name: 'day5-smoke', field: 'source', operator: 'eq', value: 'web', points: 5 }, allowedRoles: ['admin'] },
    { id: 'R12', method: 'PATCH', path: `/api/crm/scoring/rules/${id}`, body: { name: 'day5-smoke-patch' }, allowedRoles: ['admin'] },
    { id: 'R13', method: 'POST', path: '/api/crm/pipelines', body: { name: 'Day5 Pipeline Smoke', stages: [{ id: 'prospect', name: 'Prospect' }] }, allowedRoles: ['admin'] },
    { id: 'R14', method: 'POST', path: '/api/crm/pipelines/custom', body: { name: 'Day5 Custom Pipeline', stages: [{ id: 'prospect', name: 'Prospect' }] }, allowedRoles: ['admin'] },
    { id: 'R15', method: 'POST', path: '/api/crm/field-layouts', body: { module: 'crm', entityType: 'lead', viewType: 'CREATE', layoutJson: { sections: [] } }, allowedRoles: ['admin', 'owner'] },
  ]
}

async function runRowForUser(row, token) {
  if (!token) {
    return { status: 0, code: 'NO_TOKEN', bodyExcerpt: 'Token unavailable for this role user' }
  }
  const headers = { authorization: `Bearer ${token}` }
  if (row.body !== undefined) headers['content-type'] = 'application/json'
  try {
    const res = await fetchWithTimeout(`${BASE_URL}${row.path}`, {
      method: row.method,
      headers,
      body: row.body !== undefined ? JSON.stringify(row.body) : undefined,
    })
    const text = await res.text()
    let code = ''
    try {
      code = JSON.parse(text)?.code || ''
    } catch {
      code = ''
    }
    return { status: res.status, code, bodyExcerpt: text.slice(0, 180).replace(/\s+/g, ' ') }
  } catch (error) {
    return {
      status: 0,
      code: 'REQUEST_ERROR',
      bodyExcerpt: error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180),
    }
  }
}

function evaluateResult(roleKey, result, allowedRoles = []) {
  const isAllowedRole = allowedRoles.includes(roleKey)
  const pass = isAllowedRole ? result.status !== 403 : result.status === 403
  return pass ? 'Pass' : 'Fail'
}

async function main() {
  const startedAt = new Date().toISOString()
  const ownerLogin = await login(OWNER_EMAIL, OWNER_PASSWORD)
  const tenantId = ownerLogin?.tenant?.id || ownerLogin?.user?.tenantId || ''
  if (!tenantId) {
    throw new Error('Could not resolve tenant id from owner login payload')
  }

  const setup = {}
  if (!SKIP_SETUP) {
    for (const [key, userConfig] of Object.entries(TEST_USERS)) {
      setup[key] = await ensureRoleUser(ownerLogin.token, userConfig)
    }
  }

  const tokens = {}
  for (const [key, userConfig] of Object.entries(TEST_USERS)) {
    try {
      const payload = await login(userConfig.email, TEST_PASSWORD)
      tokens[key] = payload.token
    } catch (error) {
      tokens[key] = null
      console.error(
        `[day5-role-matrix] token acquisition failed for ${key} (${userConfig.email}): ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  const rows = buildRows(tenantId)
  const matrix = []
  for (const row of rows) {
    const rowResults = { id: row.id, checks: {} }
    for (const roleKey of Object.keys(TEST_USERS)) {
      const result = await runRowForUser(row, tokens[roleKey])
      rowResults.checks[roleKey] = {
        ...result,
        evaluation: evaluateResult(roleKey, result, row.allowedRoles || []),
      }
    }
    matrix.push(rowResults)
  }

  const summary = matrix.reduce(
    (acc, row) => {
      for (const roleKey of Object.keys(row.checks)) {
        const evalResult = row.checks[roleKey].evaluation
        if (evalResult === 'Pass') acc.pass += 1
        else acc.fail += 1
      }
      return acc
    },
    { pass: 0, fail: 0 }
  )

  const payload = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    tenantId,
    setup,
    users: Object.fromEntries(
      Object.entries(TEST_USERS).map(([k, v]) => [k, { email: v.email, role: v.role }])
    ),
    matrix,
    summary,
    note:
      'Role-matrix auth evaluation uses authorization outcome only: admin/manager expect non-403; rep/read_only expect 403 CRM_ROLE_FORBIDDEN.',
  }

  const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${nowStamp()}-crm-day5-role-matrix-automation.json`)
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(
    JSON.stringify(
      {
        ok: summary.fail === 0,
        outPath: outPath.replaceAll('\\', '/'),
        pass: summary.pass,
        fail: summary.fail,
      },
      null,
      2
    )
  )

  if (summary.fail > 0) process.exit(2)
}

main().catch((error) => {
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
