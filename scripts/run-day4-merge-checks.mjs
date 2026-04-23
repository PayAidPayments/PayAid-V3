#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = (process.env.BASE_URL || 'https://payaid-v3.vercel.app').replace(/\/+$/, '')
const EMAIL = process.env.CRM_LOGIN_EMAIL || process.env.DAY4_LOGIN_EMAIL || ''
const PASSWORD = process.env.CRM_LOGIN_PASSWORD || process.env.DAY4_LOGIN_PASSWORD || ''
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.DAY4_REQUEST_TIMEOUT_MS || '45000', 10)
const D3_ALLOW_NA = process.env.DAY4_D3_ALLOW_NA === '1'
const OUTPUT_PATH =
  process.env.DAY4_OUTPUT_PATH ||
  'docs/evidence/closure/2026-04-22-crm-day4-runtime-checks.md'

if (!EMAIL || !PASSWORD) {
  console.error('Missing login credentials. Set CRM_LOGIN_EMAIL and CRM_LOGIN_PASSWORD.')
  process.exit(1)
}

function nowIso() {
  return new Date().toISOString()
}

async function jsonRequest(url, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutHandle)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  return { ok: res.ok, status: res.status, data }
}

function pickCode(payload) {
  if (!payload || typeof payload !== 'object') return '-'
  return payload.code || payload.error || '-'
}

function row(id, result, status, code, notes) {
  return `| ${id} | ${result} | ${status ?? '-'} | ${code ?? '-'} | ${notes || '-'} |`
}

async function main() {
  const runStartedAt = nowIso()
  const suffix = Date.now().toString().slice(-6)

  const login = await jsonRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  })
  if (!login.ok || !login.data?.token || !login.data?.tenant?.id) {
    console.error('Login failed:', JSON.stringify(login, null, 2))
    process.exit(1)
  }

  const token = login.data.token
  const tenantId = login.data.tenant.id
  const runOperator = login.data?.user?.email || EMAIL

  const makeContact = async ({ name, email, phone, company }) =>
    jsonRequest(`${BASE_URL}/api/contacts?tenantId=${tenantId}`, {
      method: 'POST',
      token,
      body: {
        name,
        email,
        phone,
        company,
        type: 'lead',
        status: 'active',
      },
    })

  const patchContact = async (id, body) =>
    jsonRequest(`${BASE_URL}/api/contacts/${id}?tenantId=${tenantId}`, {
      method: 'PATCH',
      token,
      body,
    })

  const mergeContacts = async (primaryContactId, duplicateContactId, bypass = false) =>
    jsonRequest(`${BASE_URL}/api/contacts/duplicates?tenantId=${tenantId}`, {
      method: 'POST',
      token,
      body: {
        primaryContactId,
        duplicateContactId,
        bypassDuplicateSuggestionGuard: bypass ? true : undefined,
      },
    })

  const created = {}
  const notes = []

  // A1-A4
  const a1Email = `day4-a1-${suffix}@example.com`
  const a1Phone = `90010${suffix}`
  const a1 = await makeContact({
    name: `Day4 A1 ${suffix}`,
    email: a1Email,
    phone: a1Phone,
    company: 'Day4 QA',
  })
  if (a1.ok && a1.data?.id) created.a1 = a1.data.id

  const a2 = await makeContact({
    name: `Day4 A2 ${suffix}`,
    email: a1Email,
    phone: `90110${suffix}`,
    company: 'Day4 QA',
  })

  const a3Email = `day4-a3-${suffix}@example.com`
  const a3Phone = `90020${suffix}`
  const a3 = await makeContact({
    name: `Day4 A3 ${suffix}`,
    email: a3Email,
    phone: a3Phone,
    company: 'Day4 QA',
  })
  if (a3.ok && a3.data?.id) created.a3 = a3.data.id

  const a4 = await makeContact({
    name: `Day4 A4 ${suffix}`,
    email: `day4-a4-${suffix}@example.com`,
    phone: a3Phone,
    company: 'Day4 QA',
  })

  // B1-B3 (use a3 as mutable contact)
  const b1 = created.a3
    ? await patchContact(created.a3, { email: a1Email })
    : { status: '-', data: { code: 'SKIPPED_NO_A3' } }
  const b2 = created.a3
    ? await patchContact(created.a3, { phone: a1Phone })
    : { status: '-', data: { code: 'SKIPPED_NO_A3' } }
  const b3 = created.a3
    ? await patchContact(created.a3, { company: `Day4 QA Updated ${suffix}` })
    : { status: '-', data: { code: 'SKIPPED_NO_A3' } }

  // C1 duplicate scan
  const c1 = await jsonRequest(`${BASE_URL}/api/contacts/duplicates?threshold=70&tenantId=${tenantId}`, {
    method: 'GET',
    token,
  })

  // Pick a duplicate pair from C1 if available for D3.
  const firstPair =
    c1.data?.data?.[0] ||
    c1.data?.duplicates?.[0] ||
    null
  const pairPrimary = firstPair?.primaryContactId || firstPair?.primary?.id || null
  const pairDuplicate = firstPair?.duplicateContactId || firstPair?.duplicate?.id || null

  // D1-D6
  const d1 = created.a1
    ? await mergeContacts(created.a1, created.a1, false)
    : { status: '-', data: { code: 'SKIPPED_NO_A1' } }
  const d2 = created.a1
    ? await mergeContacts(created.a1, `missing-${suffix}`, false)
    : { status: '-', data: { code: 'SKIPPED_NO_A1' } }

  let d3 = { status: '-', data: { code: 'SKIPPED_NO_DUPLICATE_PAIR' }, result: 'Fail', notes: 'no duplicate pair available' }
  if (pairPrimary && pairDuplicate) {
    d3 = await mergeContacts(pairPrimary, pairDuplicate, false)
    notes.push(`D3 used duplicate pair from C1 scan: ${pairPrimary} <- ${pairDuplicate}`)
  } else if (D3_ALLOW_NA) {
    d3 = {
      status: '-',
      data: { code: 'D3_NA_NO_DUPLICATE_PAIR' },
      result: 'N/A-CANDIDATE',
      notes: 'no duplicate pair available in current tenant dataset; requires explicit Product+QA acceptance',
    }
  }

  const d4 =
    created.a1 && created.a3
      ? await mergeContacts(created.a1, created.a3, false)
      : { status: '-', data: { code: 'SKIPPED_NO_A1_A3' } }

  // Create no-key contacts for D5
  const nk1 = await makeContact({
    name: `Day4 NK1 ${suffix}`,
    email: '',
    phone: '',
    company: '',
  })
  if (nk1.ok && nk1.data?.id) created.nk1 = nk1.data.id
  const nk2 = await makeContact({
    name: `Day4 NK2 ${suffix}`,
    email: '',
    phone: '',
    company: '',
  })
  if (nk2.ok && nk2.data?.id) created.nk2 = nk2.data.id

  const d5 =
    created.nk1 && created.nk2
      ? await mergeContacts(created.nk1, created.nk2, false)
      : { status: '-', data: { code: 'SKIPPED_NO_NK_CONTACTS' } }

  const d6 =
    created.a1 && created.a3
      ? await mergeContacts(created.a1, created.a3, true)
      : { status: '-', data: { code: 'SKIPPED_NO_A1_A3' } }

  const md = []
  md.push('# Day 4 Runtime Checks — Duplicate/Merge (Queue #5)')
  md.push('')
  md.push(`Run date: ${runStartedAt}`)
  md.push(`Owner: Phani`)
  md.push(`Queue: #5 (Day 4 closure)`)
  md.push(`Runbook: \`docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md\``)
  md.push('')
  md.push('## Environment')
  md.push('')
  md.push(`- Base URL: ${BASE_URL}`)
  md.push(`- Tenant ID/slug: ${tenantId}`)
  md.push(`- Operator: ${runOperator}`)
  md.push(`- Auth mode: Bearer token from /api/auth/login`)
  md.push('')
  md.push('## Results (A-D)')
  md.push('')
  md.push('### A) Create duplicates')
  md.push('')
  md.push('| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |')
  md.push('|---|---|---|---|---|')
  md.push(row('A1', a1.status === 201 ? 'Pass' : 'Fail', a1.status, pickCode(a1.data), a1.data?.id ? `createdId=${a1.data.id}` : '-'))
  md.push(row('A2', a2.status === 409 ? 'Pass' : 'Fail', a2.status, pickCode(a2.data), a2.data?.existingId ? `existingId=${a2.data.existingId}` : '-'))
  md.push(row('A3', a3.status === 201 ? 'Pass' : 'Fail', a3.status, pickCode(a3.data), a3.data?.id ? `createdId=${a3.data.id}` : '-'))
  md.push(row('A4', a4.status === 409 ? 'Pass' : 'Fail', a4.status, pickCode(a4.data), a4.data?.existingId ? `existingId=${a4.data.existingId}` : '-'))
  md.push('')
  md.push('### B) Update duplicates')
  md.push('')
  md.push('| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |')
  md.push('|---|---|---|---|---|')
  md.push(row('B1', b1.status === 409 ? 'Pass' : 'Fail', b1.status, pickCode(b1.data), '-'))
  md.push(row('B2', b2.status === 409 ? 'Pass' : 'Fail', b2.status, pickCode(b2.data), '-'))
  md.push(row('B3', b3.status === 200 ? 'Pass' : 'Fail', b3.status, pickCode(b3.data), '-'))
  md.push('')
  md.push('### C) Duplicate scan')
  md.push('')
  md.push('| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |')
  md.push('|---|---|---|---|---|')
  md.push(
    row(
      'C1',
      c1.status === 200 && c1.data?.success === true ? 'Pass' : 'Fail',
      c1.status,
      pickCode(c1.data),
      Array.isArray(c1.data?.data) ? `dataCount=${c1.data.data.length}` : '-'
    )
  )
  md.push('')
  md.push('### D) Merge guards')
  md.push('')
  md.push('| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |')
  md.push('|---|---|---|---|---|')
  md.push(row('D1', d1.status === 400 ? 'Pass' : 'Fail', d1.status, pickCode(d1.data), '-'))
  md.push(row('D2', d2.status === 404 ? 'Pass' : 'Fail', d2.status, pickCode(d2.data), '-'))
  const d3Result = d3.result || (d3.status === 200 ? 'Pass' : 'Fail')
  const d3Notes = d3.notes || (pairPrimary && pairDuplicate ? 'used pair from duplicate scan' : 'no duplicate pair available')
  md.push(row('D3', d3Result, d3.status, pickCode(d3.data), d3Notes))
  md.push(row('D4', d4.status === 409 ? 'Pass' : 'Fail', d4.status, pickCode(d4.data), '-'))
  md.push(row('D5', d5.status === 409 ? 'Pass' : 'Fail', d5.status, pickCode(d5.data), '-'))
  md.push(row('D6', d6.status === 200 ? 'Pass' : 'Fail', d6.status, pickCode(d6.data), 'bypassDuplicateSuggestionGuard=true'))
  md.push('')
  md.push('## Product merge UX signoff')
  md.push('')
  md.push('- Owner:')
  md.push('- Date:')
  md.push('- Decision: Pending')
  md.push('- Notes:')
  md.push('')
  md.push('## Closure decision for Queue #5')
  md.push('')
  md.push('- Status: Partial (default until all rows + signoff complete)')
  md.push('- Remaining blockers:')
  md.push('  - Product merge UX signoff pending')
  md.push('')
  md.push('## Notes')
  md.push('')
  if (notes.length === 0) {
    md.push('- No additional notes.')
  } else {
    for (const note of notes) md.push(`- ${note}`)
  }

  const absOutput = path.resolve(process.cwd(), OUTPUT_PATH)
  await mkdir(path.dirname(absOutput), { recursive: true })
  await writeFile(absOutput, `${md.join('\n')}\n`, 'utf8')
  console.log(`Wrote Day 4 runtime artifact: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error('Day 4 merge checks failed:', error)
  process.exit(1)
})
