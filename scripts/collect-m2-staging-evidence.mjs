import fs from 'node:fs'
import path from 'node:path'
import { isStrictFlagEnabled } from './strict-flag.mjs'

const baseUrl = process.env.PAYAID_BASE_URL
const tenantId = process.env.PAYAID_TENANT_ID || ''
const authToken = process.env.PAYAID_AUTH_TOKEN
const outDir = process.env.M2_EVIDENCE_DIR || 'docs/evidence/m2-staging-validation'
const callsSampleLimit = Math.min(Number(process.env.M2_CALLS_SAMPLE_LIMIT || 100), 200)
const auditLimit = Math.min(Number(process.env.M2_AUDIT_LIMIT || 100), 500)
const fkSampleLimit = Math.min(Number(process.env.M2_FK_SAMPLE_LIMIT || 100), 500)
const validateCallFk = isStrictFlagEnabled(process.env.M2_VALIDATE_CALL_FK, {
  allowTrueString: true,
})
const requestTimeoutMs = Math.max(Number(process.env.M2_HTTP_TIMEOUT_MS || 45000), 5000)
const maxRetries = Math.max(Number(process.env.M2_HTTP_RETRIES || 2), 0)

if (!baseUrl || !authToken) {
  process.stderr.write('Missing required env vars: PAYAID_BASE_URL, PAYAID_AUTH_TOKEN.\n')
  process.stderr.write('Optional env var: PAYAID_TENANT_ID (sent as x-tenant-id header when provided).\n')
  process.stderr.write(
    'Optional DB FK check: M2_VALIDATE_CALL_FK=1 requires PAYAID_TENANT_ID and DATABASE_URL (staging read-only).\n',
  )
  process.exit(1)
}

if (validateCallFk) {
  if (!tenantId) {
    process.stderr.write(
      'M2_VALIDATE_CALL_FK is set: PAYAID_TENANT_ID is required (tenant-scoped DB query).\n',
    )
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    process.stderr.write('M2_VALIDATE_CALL_FK is set: DATABASE_URL is required (read-only Prisma access).\n')
    process.exit(1)
  }
}

const now = new Date()
const stamp = now.toISOString().replace(/[:.]/g, '-')

function authHeaders() {
  return {
    authorization: `Bearer ${authToken}`,
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(status) {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599)
}

async function fetchJson(relativePath, query = {}) {
  const url = new URL(relativePath, baseUrl)
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue
    url.searchParams.set(k, String(v))
  }

  let lastError = null
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)
    try {
      const res = await fetch(url, { headers: authHeaders(), signal: controller.signal })
      const text = await res.text()
      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        payload = { raw: text }
      }

      if (res.ok || !shouldRetry(res.status) || attempt === maxRetries) {
        return { url: url.toString(), status: res.status, ok: res.ok, payload, attempt }
      }
      await sleep(500 * (attempt + 1))
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) {
        const message = error instanceof Error ? error.message : 'fetch failed'
        const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined
        return {
          url: url.toString(),
          status: 0,
          ok: false,
          payload: { error: message, code: code || null, retry_attempts: attempt + 1 },
          attempt,
        }
      }
      await sleep(500 * (attempt + 1))
    } finally {
      clearTimeout(timeoutId)
    }
  }
  return {
    url: url.toString(),
    status: 0,
    ok: false,
    payload: {
      error: lastError instanceof Error ? lastError.message : 'fetch failed',
      retry_attempts: maxRetries + 1,
    },
    attempt: maxRetries,
  }
}

function summarizeMarketplace(result) {
  const total = Number(result.payload?.total || 0)
  const installedCount = Number(result.payload?.installed_count || 0)
  const apps = Array.isArray(result.payload?.apps) ? result.payload.apps : []
  return {
    pass: result.ok && total >= 8,
    total_catalog_apps: total,
    installed_count: installedCount,
    first_8_app_ids: apps.slice(0, 8).map((a) => a.id).filter(Boolean),
    note: total >= 8 ? 'Catalog meets M2 threshold (>=8).' : 'Catalog below threshold or unavailable.',
  }
}

function summarizeCalls(result) {
  const calls = Array.isArray(result.payload?.calls) ? result.payload.calls : []
  const linked = calls.filter((c) => c.contact_id || c.deal_id || c.lead_id)
  return {
    pass: result.ok && linked.length > 0,
    sampled_calls: calls.length,
    linked_calls: linked.length,
    linked_ratio: calls.length > 0 ? Number((linked.length / calls.length).toFixed(3)) : 0,
    sample_linked_call_ids: linked.slice(0, 10).map((c) => c.id).filter(Boolean),
    note:
      linked.length > 0
        ? 'Found calls with CRM linkage fields (contact_id/deal_id/lead_id).'
        : 'No linked calls found in sample (or endpoint failed).',
  }
}

function summarizeSdrAudit(result) {
  const actions = Array.isArray(result.payload?.actions) ? result.payload.actions : []
  const sdrActions = actions.filter((a) => a.entity_type === 'sdr_run')
  return {
    pass: result.ok && sdrActions.length > 0,
    sampled_actions: actions.length,
    sdr_run_actions: sdrActions.length,
    sample_action_ids: sdrActions.slice(0, 10).map((a) => a.id).filter(Boolean),
    note: sdrActions.length > 0 ? 'Found SDR run audit actions.' : 'No SDR run audit actions found in sample.',
  }
}

/**
 * AICall.contactId / dealId / leadId are not Prisma relations; verify tenant-scoped
 * referential integrity against Contact and Deal (leadId → Contact.id, same as product API).
 */
async function summarizeCallCrmFkFromDb(tenantIdForDb, apiCallsSample = []) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    // PAYAID_TENANT_ID is often a slug on API calls, while DB rows use Tenant.id.
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantIdForDb },
          { slug: tenantIdForDb },
          { subdomain: tenantIdForDb },
          { domain: tenantIdForDb },
        ],
      },
      select: { id: true, slug: true, subdomain: true, domain: true },
    })
    const tenantDbId = tenant?.id || tenantIdForDb

    let calls = await prisma.aICall.findMany({
      where: {
        tenantId: tenantDbId,
        OR: [{ contactId: { not: null } }, { dealId: { not: null } }, { leadId: { not: null } }],
      },
      orderBy: { startedAt: 'desc' },
      take: fkSampleLimit,
      select: { id: true, tenantId: true, contactId: true, dealId: true, leadId: true },
    })
    const apiCallIds = Array.isArray(apiCallsSample)
      ? apiCallsSample.map((c) => c?.id).filter(Boolean).slice(0, fkSampleLimit)
      : []
    if (calls.length === 0 && apiCallIds.length > 0) {
      calls = await prisma.aICall.findMany({
        where: {
          id: { in: apiCallIds },
          OR: [{ contactId: { not: null } }, { dealId: { not: null } }, { leadId: { not: null } }],
        },
        select: { id: true, tenantId: true, contactId: true, dealId: true, leadId: true },
      })
    }
    if (calls.length === 0) {
      return {
        skipped: false,
        pass: false,
        sampled_calls: 0,
        invalid_references: [],
        note:
          'No AICall rows with contact_id/deal_id/lead_id for this tenant in DB sample; cannot prove CRM linkage at DB layer.',
        tenant_db_id_used: tenantDbId,
      }
    }
    const contactIds = new Set()
    const dealIds = new Set()
    for (const c of calls) {
      if (c.contactId) contactIds.add(c.contactId)
      if (c.leadId) contactIds.add(c.leadId)
      if (c.dealId) dealIds.add(c.dealId)
    }
    const [contacts, deals] = await Promise.all([
      contactIds.size
        ? prisma.contact.findMany({
            where: { id: { in: [...contactIds] } },
            select: { id: true, tenantId: true },
          })
        : Promise.resolve([]),
      dealIds.size
        ? prisma.deal.findMany({
            where: { id: { in: [...dealIds] } },
            select: { id: true, tenantId: true },
          })
        : Promise.resolve([]),
    ])
    const contactOwners = new Map(contacts.map((x) => [x.id, x.tenantId]))
    const dealOwners = new Map(deals.map((x) => [x.id, x.tenantId]))
    const invalid = []
    for (const c of calls) {
      if (c.contactId && contactOwners.get(c.contactId) !== c.tenantId) {
        invalid.push({ call_id: c.id, field: 'contact_id', value: c.contactId })
      }
      if (c.leadId && contactOwners.get(c.leadId) !== c.tenantId) {
        invalid.push({ call_id: c.id, field: 'lead_id', value: c.leadId })
      }
      if (c.dealId && dealOwners.get(c.dealId) !== c.tenantId) {
        invalid.push({ call_id: c.id, field: 'deal_id', value: c.dealId })
      }
    }
    return {
      skipped: false,
      pass: invalid.length === 0,
      sampled_calls: calls.length,
      distinct_contact_ids_checked: contactIds.size,
      distinct_deal_ids_checked: dealIds.size,
      invalid_references: invalid.slice(0, 50),
      invalid_count: invalid.length,
      tenant_db_id_used: tenantDbId,
      note:
        invalid.length === 0
          ? 'All sampled AICall CRM pointers resolve to Contact/Deal rows for this tenant.'
          : 'One or more AICall CRM pointers do not resolve to tenant-scoped Contact/Deal rows.',
    }
  } finally {
    await prisma.$disconnect()
  }
}

const marketplace = await fetchJson('/api/v1/marketplace/apps')
const calls = await fetchJson('/api/v1/calls', { limit: callsSampleLimit, page: 1 })
const sdrAudit = await fetchJson('/api/v1/audit/actions', { entityType: 'sdr_run', limit: auditLimit })

let callCrmFkDb = {
  skipped: true,
  pass: true,
  note: 'Set M2_VALIDATE_CALL_FK=1 with DATABASE_URL and PAYAID_TENANT_ID to verify AICall → Contact/Deal integrity.',
}
if (validateCallFk) {
  callCrmFkDb = await summarizeCallCrmFkFromDb(tenantId, calls.payload?.calls || [])
}

const summary = {
  collected_at_utc: now.toISOString(),
  tenant_id: tenantId || null,
  checks: {
    marketplace_min_8_apps: summarizeMarketplace(marketplace),
    calls_crm_linkage_present_in_sample: summarizeCalls(calls),
    sdr_audit_trace_present: summarizeSdrAudit(sdrAudit),
    calls_crm_fk_db_integrity: callCrmFkDb,
  },
}

summary.overall = {
  pass:
    summary.checks.marketplace_min_8_apps.pass &&
    summary.checks.calls_crm_linkage_present_in_sample.pass &&
    summary.checks.sdr_audit_trace_present.pass &&
    (callCrmFkDb.skipped ? true : callCrmFkDb.pass),
}

const body = {
  summary,
  raw: {
    marketplace,
    calls,
    sdr_audit: sdrAudit,
  },
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
const fileName = `${stamp}-${tenantId || 'tenant-unknown'}-m2-staging-validation.json`
const outPath = path.join(outDir, fileName)
fs.writeFileSync(outPath, `${JSON.stringify(body, null, 2)}\n`, 'utf8')

process.stdout.write(`M2 staging evidence saved: ${outPath}\n`)
process.stdout.write(`Overall pass: ${summary.overall.pass ? 'YES' : 'NO'}\n`)

if (!summary.overall.pass) {
  process.stderr.write('One or more checks failed; inspect JSON output for details.\n')
  process.exit(1)
}
