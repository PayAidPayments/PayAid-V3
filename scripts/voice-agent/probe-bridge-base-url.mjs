#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const candidates = [
  process.env.BASE_URL,
  process.env.PAYAID_BRIDGE_BASE_URL,
  'https://voice-payaid-projects-a67c6b27.vercel.app',
  'https://voice-emrn0qy95-payaid-projects-a67c6b27.vercel.app',
].filter(Boolean)

const bypass = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

async function probe(base) {
  const url = new URL(`${base.replace(/\/$/, '')}/api/v1/voice-agents/runtime/bolna/kb/search`)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    },
    body: '{}',
    signal: AbortSignal.timeout(25000),
  })
  const text = await res.text()
  const sso = text.includes('Authentication Required') || (text.includes('<!DOCTYPE') && !text.trim().startsWith('{'))
  const deployFailed = text.includes('Deployment has failed')
  const json401 = res.status === 401 && text.trim().startsWith('{')
  return {
    base: base.replace(/\/$/, ''),
    status: res.status,
    bridgeGate: json401,
    sso,
    deployFailed,
    note: json401 ? 'bridge_auth_gate' : sso ? 'vercel_sso' : deployFailed ? 'deploy_failed' : `http_${res.status}`,
    snippet: text.slice(0, 100),
  }
}

const results = []
for (const c of [...new Set(candidates)]) {
  try {
    results.push(await probe(c))
  } catch (e) {
    results.push({ base: c, bridgeGate: false, note: e instanceof Error ? e.message : String(e) })
  }
}
const winner = results.find((r) => r.bridgeGate)
console.log(JSON.stringify({ winner: winner?.base || null, bypassSet: Boolean(bypass), results }, null, 2))
process.exit(winner ? 0 : 1)
