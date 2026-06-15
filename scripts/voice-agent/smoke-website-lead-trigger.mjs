#!/usr/bin/env node
/**
 * Smoke: website lead → lead.triggered.call → campaign contact queue.
 *
 * Usage (auth session):
 *   SMOKE_AUTH_TOKEN=… SMOKE_AGENT_ID=… node scripts/voice-agent/smoke-website-lead-trigger.mjs
 *
 * Usage (webhook secret):
 *   VOICE_TRIGGER_WEBHOOK_SECRET=… x-tenant-id + x-voice-trigger-secret headers
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const base =
  process.env.VOICE_BASE_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:3003'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const token = process.env.SMOKE_AUTH_TOKEN
const secret = process.env.VOICE_TRIGGER_WEBHOOK_SECRET?.trim()
const phone = `9${String(Date.now()).slice(-9)}`

const url = `${base.replace(/\/$/, '')}/api/v1/voice-agents/triggers/website-lead`
const headers = { 'Content-Type': 'application/json' }
if (secret) {
  headers['x-voice-trigger-secret'] = secret
  headers['x-tenant-id'] = tenantId
} else if (token) {
  headers.Authorization = `Bearer ${token}`
} else {
  console.error(JSON.stringify({ ok: false, error: 'Set SMOKE_AUTH_TOKEN or VOICE_TRIGGER_WEBHOOK_SECRET' }))
  process.exit(1)
}

const res = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    agentId,
    phone,
    name: 'Smoke Lead',
    source: 'website_form',
    formId: 'smoke-test',
  }),
  signal: AbortSignal.timeout(30_000),
})

const body = await res.json().catch(() => ({}))
const ok = res.ok && body.ok && body.status === 'queued'
console.log(JSON.stringify({ ok, status: res.status, phone, body }, null, 2))
process.exit(ok ? 0 : 1)
