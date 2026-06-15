#!/usr/bin/env node
/**
 * Smoke all Phase 2 voice trigger webhooks (queue only).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const base =
  process.env.VOICE_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3003'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const token = process.env.SMOKE_AUTH_TOKEN
const secret = process.env.VOICE_TRIGGER_WEBHOOK_SECRET?.trim()
const bypass = process.env.VERCEL_PROTECTION_BYPASS || ''
const phone = `9${String(Date.now()).slice(-9)}`

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (bypass) h['x-vercel-protection-bypass'] = bypass
  if (secret) {
    h['x-voice-trigger-secret'] = secret
    h['x-tenant-id'] = tenantId
  } else if (token) {
    h.Authorization = `Bearer ${token}`
  }
  return h
}

function withBypass(url) {
  if (!bypass) return url
  const u = new URL(url)
  u.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  u.searchParams.set('x-vercel-protection-bypass', bypass)
  return u.toString()
}

if (!secret && !token) {
  console.error(JSON.stringify({ ok: false, error: 'Set SMOKE_AUTH_TOKEN or VOICE_TRIGGER_WEBHOOK_SECRET' }))
  process.exit(1)
}

const tests = [
  {
    name: 'website-lead',
    path: '/api/v1/voice-agents/triggers/website-lead',
    body: { agentId, phone, name: 'Smoke Web', formId: 'smoke' },
  },
  {
    name: 'crm-stage-new_lead',
    path: '/api/v1/voice-agents/triggers/crm-stage',
    body: { agentId, phone: `9${String(Date.now() + 1).slice(-9)}`, stageTrigger: 'new_lead', name: 'Smoke CRM' },
  },
  {
    name: 'missed-call',
    path: '/api/v1/voice-agents/triggers/missed-call',
    body: { agentId, phone: `9${String(Date.now() + 2).slice(-9)}`, missedCallSid: 'CA_smoke_test' },
  },
  {
    name: 'marketing-facebook',
    path: '/api/v1/voice-agents/triggers/marketing-lead',
    body: {
      agentId,
      phone: `9${String(Date.now() + 3).slice(-9)}`,
      source: 'facebook_lead',
      platformLeadId: 'fb_smoke_1',
    },
  },
]

const results = []
for (const t of tests) {
  let ok = false
  let status = 0
  let body = {}
  try {
    const res = await fetch(withBypass(`${base.replace(/\/$/, '')}${t.path}`), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(t.body),
      signal: AbortSignal.timeout(30_000),
    })
    status = res.status
    body = await res.json().catch(() => ({}))
    ok = res.ok && body.ok && body.status === 'queued'
  } catch (e) {
    body = { error: e instanceof Error ? e.message : String(e) }
  }
  results.push({ name: t.name, ok, status, campaignContactId: body.campaignContactId })
}

const allOk = results.every((r) => r.ok)
console.log(JSON.stringify({ ok: allOk, results }, null, 2))
process.exit(allOk ? 0 : 1)
