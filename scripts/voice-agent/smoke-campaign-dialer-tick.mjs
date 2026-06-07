#!/usr/bin/env node
/**
 * Smoke campaign dialer tick — queues a contact then dials (stub mode without Twilio).
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
const phone = `9${String(Date.now()).slice(-9)}`

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (secret) {
    h['x-voice-trigger-secret'] = secret
    h['x-tenant-id'] = tenantId
  } else if (token) {
    h.Authorization = `Bearer ${token}`
  }
  return h
}

if (!secret && !token) {
  console.error(JSON.stringify({ ok: false, error: 'Set SMOKE_AUTH_TOKEN or VOICE_TRIGGER_WEBHOOK_SECRET' }))
  process.exit(1)
}

const triggerRes = await fetch(`${base.replace(/\/$/, '')}/api/v1/voice-agents/triggers/website-lead`, {
  method: 'POST',
  headers: headers(),
  body: JSON.stringify({ agentId, phone, name: 'Dialer Smoke', formId: 'dialer-smoke' }),
  signal: AbortSignal.timeout(30_000),
})
const triggerBody = await triggerRes.json().catch(() => ({}))
if (!triggerRes.ok || !triggerBody.campaignId) {
  console.error(JSON.stringify({ ok: false, step: 'trigger', status: triggerRes.status, triggerBody }))
  process.exit(1)
}

const campaignId = triggerBody.campaignId

const startRes = await fetch(`${base.replace(/\/$/, '')}/api/v1/voice-agents/campaigns/${campaignId}/start`, {
  method: 'POST',
  headers: headers(),
  signal: AbortSignal.timeout(30_000),
})
const startBody = await startRes.json().catch(() => ({}))
if (!startRes.ok) {
  console.error(JSON.stringify({ ok: false, step: 'start', status: startRes.status, startBody }))
  process.exit(1)
}

const tickRes = await fetch(`${base.replace(/\/$/, '')}/api/v1/voice-agents/campaigns/${campaignId}/tick`, {
  method: 'POST',
  headers: headers(),
  signal: AbortSignal.timeout(30_000),
})
const tickBody = await tickRes.json().catch(() => ({}))
const dialed = tickRes.ok && tickBody.result?.status === 'dialed'

console.log(
  JSON.stringify({
    ok: dialed,
    campaignId,
    dialMode: tickBody.result?.dialMode,
    callId: tickBody.result?.callId,
    resultStatus: tickBody.result?.status,
  }),
)
process.exit(dialed ? 0 : 1)
