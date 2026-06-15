#!/usr/bin/env node
/**
 * No-404 QA: Voice Inbox page + inbox API.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const base =
  process.env.VOICE_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3003'
const bypass = process.env.VERCEL_PROTECTION_BYPASS || ''

async function probePage() {
  const url = new URL(`${base.replace(/\/$/, '')}/voice-agents/${tenantId}/Inbox`)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }
  const res = await fetch(url.toString(), {
    headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
    signal: AbortSignal.timeout(25_000),
  })
  const text = await res.text()
  const routeShell =
    text.includes('Loading voice inbox') ||
    text.includes('VoiceInbox') ||
    text.includes('/Inbox')
  const hard404 =
    res.status === 404 ||
    (text.includes('This page could not be found') && !routeShell)
  return { ok: res.status === 200 && routeShell && !hard404, status: res.status }
}

async function probeApi() {
  const token = process.env.SMOKE_AUTH_TOKEN
  if (!token) return { ok: false, skipped: true, reason: 'no token' }
  const url = new URL(`${base.replace(/\/$/, '')}/api/v1/voice-agents/inbox`)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    },
    signal: AbortSignal.timeout(25_000),
  })
  return { ok: res.status !== 404, status: res.status }
}

const page = await probePage()
const api = await probeApi()
const ok = page.ok && (api.ok || api.skipped)
console.log(JSON.stringify({ ok, page, api }, null, 2))
process.exit(ok ? 0 : 1)
