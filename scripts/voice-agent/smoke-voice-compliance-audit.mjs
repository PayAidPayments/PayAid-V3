#!/usr/bin/env node
/**
 * Smoke: compliance audit API returns 200 (not 404).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const base =
  process.env.VOICE_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3003'
const bypass = process.env.VERCEL_PROTECTION_BYPASS || ''
const token = process.env.SMOKE_AUTH_TOKEN

async function probe() {
  if (!token) return { ok: false, skipped: true, reason: 'no token' }
  const url = new URL(`${base.replace(/\/$/, '')}/api/v1/voice-agents/compliance/audit`)
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
  const body = await res.json().catch(() => ({}))
  return { ok: res.status === 200 && body.ok === true, status: res.status, body }
}

const result = await probe()
console.log(JSON.stringify(result, null, 2))
process.exit(result.ok || result.skipped ? 0 : 1)
