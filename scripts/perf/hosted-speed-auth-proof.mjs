#!/usr/bin/env node
/**
 * Hosted proof pack for live-speed + Voice SSO lane.
 * Usage:
 *   node scripts/perf/hosted-speed-auth-proof.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const BASE = process.env.PERF_BASE_URL || 'https://payaid-v3.vercel.app'
const VOICE = process.env.PERF_VOICE_URL || 'https://voice-six-xi.vercel.app'
const EMAIL = process.env.PERF_TEST_EMAIL || 'admin@demo.com'
const PASSWORD = process.env.PERF_TEST_PASSWORD || 'Test@1234'
const BUDGET = Number(process.env.PERF_API_BUDGET_MS || 8000)

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../../docs/evidence/perf')
mkdirSync(outDir, { recursive: true })

const results = {
  measuredAt: new Date().toISOString(),
  base: BASE,
  voice: VOICE,
  budgetMs: BUDGET,
  login: null,
  apis: [],
  voiceHop: null,
  chrome: null,
  summary: { pass: false, failures: [] },
}

async function timedFetch(label, url, init = {}) {
  const t0 = performance.now()
  const res = await fetch(url, init)
  const ms = Math.round(performance.now() - t0)
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* non-json */
  }
  return { label, url, status: res.status, ms, json, textSlice: text.slice(0, 240), headers: Object.fromEntries(res.headers) }
}

async function main() {
  const login = await timedFetch('login', `${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  results.login = {
    status: login.status,
    ms: login.ms,
    hasToken: Boolean(login.json?.token),
    tenantId: login.json?.tenant?.id || login.json?.user?.tenantId || null,
  }
  if (!login.json?.token) {
    results.summary.failures.push('login failed')
    finish()
    process.exit(1)
  }

  const token = login.json.token
  const tenantId = results.login.tenantId || 'cmjptk2mw0000aocw31u48n64'
  const auth = { Authorization: `Bearer ${token}` }
  const userId = login.json.user?.id || login.json.userId

  const apiSpecs = [
    ['home-summary', `${BASE}/api/home/summary?tenantId=${tenantId}`],
    ['home-briefing', `${BASE}/api/home/briefing?tenantId=${tenantId}&fast=1`],
    ['crm-stats-lite', `${BASE}/api/crm/dashboard/stats?period=month&lite=1&tenantId=${tenantId}`],
    ['deals', `${BASE}/api/deals?page=1&limit=10&tenantId=demo&timePeriod=month`],
    ['hr-summary', `${BASE}/api/hr/summary`],
    ['finance-stats', `${BASE}/api/finance/dashboard/stats?tenantId=${tenantId}`],
    ['trial-status', `${BASE}/api/billing/trial-status`],
    ['notifications', `${BASE}/api/notifications?limit=50`],
    ['news', `${BASE}/api/news?limit=1`],
  ]

  for (const [label, url] of apiSpecs) {
    const r = await timedFetch(label, url, { headers: auth })
    const row = {
      label,
      status: r.status,
      ms: r.ms,
      overBudget: r.ms > BUDGET,
      serverTiming: r.headers['server-timing'] || null,
      degraded: Boolean(r.json?.degraded),
      error: r.json?.error || null,
    }
    results.apis.push(row)
    if (r.status >= 500) results.summary.failures.push(`${label} HTTP ${r.status}`)
    if (label === 'home-briefing' && r.status >= 500) results.summary.failures.push('briefing still 500')
    if (label === 'trial-status' && r.status >= 500) results.summary.failures.push('trial-status still 500')
  }

  // Voice hop: middleware should 307 to voice host with sso params when cookie present.
  // Simulate via Authorization cookie-less path is hard; instead check absolute SSO URL works.
  const ssoUrl = `${VOICE}/voice-agents/demo/Home?sso_token=${encodeURIComponent(token)}&tenant_id=${encodeURIComponent(tenantId)}&user_id=${encodeURIComponent(userId || 'unknown')}`
  const voiceHome = await timedFetch('voice-home-sso', ssoUrl, { redirect: 'manual' })
  const voiceMe = await timedFetch('voice-auth-me', `${VOICE}/api/auth/me`, { headers: auth })
  results.voiceHop = {
    ssoLandingStatus: voiceHome.status,
    ssoLandingMs: voiceHome.ms,
    voiceMeStatus: voiceMe.status,
    voiceMeMs: voiceMe.ms,
    voiceMeOk: voiceMe.status === 200 && Boolean(voiceMe.json?.user || voiceMe.json?.id || voiceMe.json?.email),
  }
  if (!results.voiceHop.voiceMeOk) {
    results.summary.failures.push('voice /api/auth/me did not accept shared JWT')
  }

  // Chrome APIs should succeed (deferral is client-side); record latency vs budget.
  results.chrome = {
    notificationsMs: results.apis.find((a) => a.label === 'notifications')?.ms ?? null,
    newsMs: results.apis.find((a) => a.label === 'news')?.ms ?? null,
    note: 'Deferral is client-side (2s delay / open-only). This proves endpoints are healthy, not that UI deferred.',
  }

  const critical = ['hr-summary', 'finance-stats', 'crm-stats-lite', 'home-summary', 'home-briefing', 'deals']
  for (const label of critical) {
    const row = results.apis.find((a) => a.label === label)
    if (row?.overBudget) results.summary.failures.push(`${label} ${row.ms}ms > ${BUDGET}ms budget`)
  }

  results.summary.pass = results.summary.failures.length === 0
  finish()
  process.exit(results.summary.pass ? 0 : 2)
}

function finish() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = join(outDir, `hosted-speed-auth-proof-${stamp}.json`)
  writeFileSync(path, JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ evidence: path, ...results.summary, loginMs: results.login?.ms, voiceMeOk: results.voiceHop?.voiceMeOk, apis: results.apis.map((a) => ({ label: a.label, status: a.status, ms: a.ms })) }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
