#!/usr/bin/env node
/**
 * Print a voice deployment BASE_URL where bridge routes return 401 (not HTML 404/SSO).
 */
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })

const candidates = [
  process.env.BASE_URL,
  process.env.VOICE_APP_BASE_URL,
  process.env.PAYAID_BRIDGE_BASE_URL,
  'https://voice-emrn0qy95-payaid-projects-a67c6b27.vercel.app',
  'https://voice-payaid-projects-a67c6b27.vercel.app',
].filter(Boolean)

const bypass = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

async function probe(base) {
  const url = new URL(`${base.replace(/\/$/, '')}/api/v1/voice-agents/runtime/bolna/kb/search`)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    },
    body: '{}',
    signal: AbortSignal.timeout(20000),
  })
  const ct = res.headers.get('content-type') || ''
  const text = (await res.text()).slice(0, 120)
  const htmlSso =
    text.includes('Authentication Required') ||
    (text.includes('<!doctype html>') && !text.includes('application/json'))
  const json401 = res.status === 401 && (text.trim().startsWith('{') || ct.includes('json'))
  return {
    base: base.replace(/\/$/, ''),
    status: res.status,
    routeExists: json401 || (!htmlSso && res.status !== 404 && res.status !== 401),
    note: htmlSso ? 'vercel_sso' : json401 || res.status === 401 ? 'bridge_auth_gate' : `http_${res.status}`,
  }
}

const results = []
for (const c of [...new Set(candidates)]) {
  try {
    results.push(await probe(c))
  } catch (e) {
    results.push({ base: c, routeExists: false, note: e instanceof Error ? e.message : String(e) })
  }
}

const winner = results.find((r) => r.routeExists)
console.log(JSON.stringify({ winner: winner?.base || null, results }, null, 2))
process.exit(winner ? 0 : 1)
