#!/usr/bin/env node
/**
 * No-404 QA: Voice Agents LiveDemo page must resolve (not Next 404 / missing route).
 *
 * Usage:
 *   npm run voice-agent:smoke-live-demo-no-404
 *   VOICE_BASE_URL=http://127.0.0.1:3003 npm run voice-agent:smoke-live-demo-no-404
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const bypass = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

const candidates = [
  process.env.VOICE_BASE_URL,
  process.env.BASE_URL,
  process.env.VOICE_APP_BASE_URL,
  'http://127.0.0.1:3003',
  'https://voice-six-xi.vercel.app',
].filter(Boolean)

function isNotFoundPage(status, text, contentType) {
  if (status === 404) return true
  const body = (text || '').slice(0, 4000)
  if (body.includes('This page could not be found')) return true
  if (body.includes('404: This page could not be found')) return true
  if (status >= 400 && contentType.includes('text/html') && body.includes('not found') && body.length < 8000) {
    return true
  }
  return false
}

async function probe(base) {
  const normalized = base.replace(/\/$/, '')
  const route = `/voice-agents/${tenantId}/LiveDemo`
  const url = new URL(`${normalized}${route}`)
  url.searchParams.set('agentId', agentId)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
  })
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  const htmlSso =
    text.includes('Authentication Required') ||
    (text.includes('<!doctype html>') && text.includes('Vercel') && text.includes('login'))
  const notFound = isNotFoundPage(res.status, text, contentType)
  const hasLiveDemoShell =
    text.includes('Loading live voice demo') ||
    text.includes('Loading live voice') ||
    text.includes('VoiceAgentLiveDemo') ||
    text.includes('live voice demo') ||
    (res.status === 200 && contentType.includes('text/html') && !notFound)

  return {
    base: normalized,
    url: url.toString(),
    status: res.status,
    contentType,
    notFound,
    htmlSso,
    routeOk: !notFound && !htmlSso && (hasLiveDemoShell || res.status === 200),
    note: htmlSso ? 'vercel_sso' : notFound ? 'next_404' : hasLiveDemoShell ? 'live_demo_shell' : `http_${res.status}`,
  }
}

async function main() {
  const results = []
  for (const base of [...new Set(candidates)]) {
    try {
      results.push(await probe(base))
    } catch (e) {
      results.push({
        base,
        routeOk: false,
        note: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const winner = results.find((r) => r.routeOk)
  const iso = new Date().toISOString()
  const stamp = iso.slice(0, 10)
  const evidenceDir = path.join(root, 'docs', 'evidence', 'voice-agent')
  mkdirSync(evidenceDir, { recursive: true })
  const evidencePath = path.join(evidenceDir, `${stamp}-live-demo-no-404.md`)
  const lines = [
    '# Voice Agents LiveDemo — No-404 QA',
    '',
    `- Timestamp: ${iso}`,
    `- Route: /voice-agents/${tenantId}/LiveDemo?agentId=${agentId}`,
    `- Result: ${winner ? 'PASS' : 'FAIL'}`,
    '',
    '## Probes',
    '',
    ...results.map(
      (r) =>
        `- ${r.routeOk ? 'PASS' : 'FAIL'} ${r.base || '(unknown)'} — ${r.note || 'n/a'}${r.status ? ` (HTTP ${r.status})` : ''}`,
    ),
    '',
  ]
  writeFileSync(evidencePath, `${lines.join('\n')}\n`)

  const payload = { ok: !!winner, winner: winner?.base || null, evidencePath, results }
  console.log(JSON.stringify(payload, null, 2))
  process.exit(winner ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
