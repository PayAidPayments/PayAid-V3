#!/usr/bin/env node
/**
 * Hosted authenticated smoke for customer Flows APIs.
 *
 * Requires a working production DB + demo/login user:
 *   SMOKE_BASE_URL=https://payaid-v3.vercel.app
 *   SMOKE_EMAIL=...
 *   SMOKE_PASSWORD=...
 *
 * Run:
 *   node scripts/smoke-customer-flows-hosted.mjs
 */
const base = process.env.SMOKE_BASE_URL || 'https://payaid-v3.vercel.app'
const email = process.env.SMOKE_EMAIL
const password = process.env.SMOKE_PASSWORD

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

if (!email || !password) {
  fail('Set SMOKE_EMAIL and SMOKE_PASSWORD (production login).')
}

async function main() {
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginJson = await loginRes.json().catch(() => ({}))
  if (!loginRes.ok || !(loginJson.token || loginJson.accessToken)) {
    fail(
      `Login failed status=${loginRes.status} error=${loginJson.error || loginJson.message || 'unknown'}`,
    )
  }

  const token = loginJson.token || loginJson.accessToken
  const tenantId =
    loginJson.user?.tenantId || loginJson.tenantId || loginJson.user?.tenant_id
  if (!tenantId) fail('Login succeeded but tenantId missing in response')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  async function hit(method, path, body) {
    const r = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await r.json().catch(() => ({}))
    return { status: r.status, json }
  }

  const sales = await hit('POST', '/api/ai/customer-flows/sales-follow-up', {
    contactName: 'Smoke Contact',
    companyName: 'Smoke Co',
    dealValueInr: 50000,
    notes: 'hosted smoke',
  })
  console.log(
    'sales',
    sales.status,
    JSON.stringify({
      allowed: sales.json.allowed,
      reasonCode: sales.json.reasonCode,
      draftId: sales.json.bundle?.draftId,
      executable: sales.json.bundle?.executable,
    }),
  )
  if (!(sales.status === 200 && sales.json.allowed && sales.json.bundle?.executable === false)) {
    fail('sales-follow-up smoke failed (expected allowed draft, executable=false)')
  }

  const gst = await hit('POST', '/api/ai/customer-flows/gst-invoice-draft', {
    customerName: 'Smoke Customer',
    customerGstin: '27AAAAA0000A1Z5',
    placeOfSupply: 'MH',
    lines: [
      {
        description: 'Implementation',
        hsnSac: '998314',
        quantity: 1,
        unitPriceInr: 10000,
        gstRatePct: 18,
      },
    ],
  })
  console.log(
    'gst',
    gst.status,
    JSON.stringify({
      allowed: gst.json.allowed,
      reasonCode: gst.json.reasonCode,
      draftId: gst.json.bundle?.draftId,
      executable: gst.json.bundle?.executable,
      approvalStatus: gst.json.bundle?.approvalStatus,
    }),
  )
  if (!(gst.status === 200 && gst.json.allowed && gst.json.bundle?.executable === false)) {
    fail('gst-invoice-draft smoke failed (expected allowed draft, executable=false)')
  }

  const orch = await hit('POST', '/api/ai/customer-flows/orchestrate', {
    runbook: 'sales-follow-up',
    contactName: 'Orch Smoke',
    companyName: 'Orch Co',
    dealValueInr: 25000,
  })
  console.log(
    'orch',
    orch.status,
    JSON.stringify({
      allowed: orch.json.allowed,
      reasonCode: orch.json.reasonCode,
      draftId: orch.json.bundle?.draftId,
      executable: orch.json.bundle?.executable,
    }),
  )
  if (!(orch.status === 200 && orch.json.allowed && orch.json.bundle?.executable === false)) {
    fail('orchestrate smoke failed (expected allowed draft, executable=false)')
  }

  const drafts = await hit('GET', '/api/ai/customer-flows/drafts?pending=1')
  const list = drafts.json.drafts || drafts.json.items || []
  console.log('drafts', drafts.status, JSON.stringify({ count: Array.isArray(list) ? list.length : null }))
  if (drafts.status !== 200) fail('drafts list failed')

  const rejectId = orch.json.bundle?.draftId || sales.json.bundle?.draftId
  const approveId = gst.json.bundle?.draftId
  if (!rejectId || !approveId) fail('missing draft ids for approve/reject')

  const reject = await hit(
    'POST',
    `/api/ai/customer-flows/drafts/${encodeURIComponent(rejectId)}/approve`,
    { decision: 'reject', reason: 'hosted smoke reject' },
  )
  console.log(
    'reject',
    reject.status,
    JSON.stringify({
      approvalStatus: reject.json.bundle?.approvalStatus || reject.json.approvalStatus,
      executable: reject.json.bundle?.executable,
    }),
  )
  if (reject.status >= 400) fail('reject failed')

  const approve = await hit(
    'POST',
    `/api/ai/customer-flows/drafts/${encodeURIComponent(approveId)}/approve`,
    { decision: 'approve', reason: 'hosted smoke approve' },
  )
  console.log(
    'approve',
    approve.status,
    JSON.stringify({
      approvalStatus: approve.json.bundle?.approvalStatus || approve.json.approvalStatus,
      executable: approve.json.bundle?.executable,
    }),
  )
  if (approve.status >= 400) fail('approve failed')
  if (approve.json.bundle?.executable === true) {
    fail('approve must not mark draft executable')
  }

  const page = await fetch(`${base}/ai-studio/${tenantId}/Flows`, { redirect: 'manual' })
  console.log('flows_page', page.status)
  if (page.status >= 400) fail('Flows page not reachable')

  console.log('hosted customer flows smoke PASS')
}

main().catch((err) => fail(err?.message || String(err)))
