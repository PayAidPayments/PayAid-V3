#!/usr/bin/env node
/**
 * Smoke: Bolna tenant-bridge routes (tools/execute, kb/search, events).
 * Requires BASE_URL, BOLNA_BRIDGE_SECRET, TENANT_ID, VOICE_AGENT_BOLNA_SMOKE_AGENT_ID.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ quiet: true })
const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')

function getEnv(...keys) {
  for (const key of keys) {
    const v = process.env[key]
    if (v && String(v).trim()) return String(v).trim()
  }
  return ''
}

function withVercelBypass(url, bypass) {
  if (!bypass) return url
  const u = new URL(url)
  u.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  u.searchParams.set('x-vercel-protection-bypass', bypass)
  return u.toString()
}

async function callJson({ method, url, headers, body, timeoutMs, vercelBypass }) {
  const started = Date.now()
  const finalUrl = withVercelBypass(url, vercelBypass)
  try {
    const res = await fetch(finalUrl, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    const htmlFailure =
      text.includes('Deployment has failed') ||
      (text.includes('<!DOCTYPE html>') && !text.includes('"ok"'))
    const ok = res.ok && !htmlFailure && json != null
    return { ok, status: res.status, durationMs: Date.now() - started, json, bodyText: text.slice(0, 2000) }
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      json: null,
      bodyText: error instanceof Error ? error.message : String(error),
    }
  }
}

function mintJwt(tenantId, agentId, callSid) {
  const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const script = path.join(root, 'scripts/voice-agent/mint-bolna-call-jwt.ts')
  const result = spawnSync(
    process.execPath,
    [tsx, script, tenantId, agentId, callSid],
    { cwd: root, encoding: 'utf8', env: process.env },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr || 'mint-bolna-call-jwt failed')
  }
  return (result.stdout || '').trim()
}

async function main() {
  const baseUrl = getEnv('BASE_URL', 'PAYAID_BRIDGE_BASE_URL', 'APP_BASE_URL').replace(/\/$/, '')
  const bridgeSecret = getEnv('BOLNA_BRIDGE_SECRET')
  const tenantId = getEnv('TENANT_ID') || 'cmjptk2mw0000aocw31u48n64'
  const agentId = getEnv('VOICE_AGENT_BOLNA_SMOKE_AGENT_ID') || 'va_stage1_bolna_smoke'
  const callSid = getEnv('VOICE_AGENT_BOLNA_SMOKE_CALL_SID') || 'CA_STAGE1_SMOKE_LIVE'
  const timeoutMs = Number(process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '20000')
  const vercelBypass = getEnv('VERCEL_PROTECTION_BYPASS', 'VERCEL_AUTOMATION_BYPASS_SECRET')

  const outputDir = path.join(root, 'docs', 'evidence', 'voice-agent')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-bolna-bridge-stage1-smoke.md`)

  const missing = []
  if (!baseUrl) missing.push('BASE_URL or PAYAID_BRIDGE_BASE_URL')
  if (!bridgeSecret) missing.push('BOLNA_BRIDGE_SECRET')
  if (!tenantId) missing.push('TENANT_ID')
  if (!agentId) missing.push('VOICE_AGENT_BOLNA_SMOKE_AGENT_ID')

  const lines = [
    '# Bolna Bridge Stage 1 Smoke',
    '',
    `- Timestamp: ${iso}`,
    `- Base URL: ${baseUrl || '[missing]'}`,
    `- Tenant: ${tenantId || '[missing]'}`,
    `- Agent: ${agentId || '[missing]'}`,
    `- Call SID: ${callSid}`,
    `- Vercel deployment protection bypass: ${vercelBypass ? 'set' : 'unset'}`,
    '',
  ]

  if (missing.length) {
    lines.push(`## Result`, '', `- FAIL missing env: ${missing.join(', ')}`)
    writeFileSync(outputPath, `${lines.join('\n')}\n`)
    console.log(JSON.stringify({ ok: false, outputPath, missing }, null, 2))
    process.exit(1)
  }

  const jwt = mintJwt(tenantId, agentId, callSid)
  const bridgeHeaders = {
    'X-PayAid-Bridge-Secret': bridgeSecret,
    Authorization: `Bearer ${jwt}`,
    ...(vercelBypass ? { 'x-vercel-protection-bypass': vercelBypass } : {}),
  }

  const toolRes = await callJson({
    method: 'POST',
    url: `${baseUrl}/api/v1/voice-agents/runtime/bolna/tools/execute`,
    headers: bridgeHeaders,
    body: { action: 'ping', args: { message: 'stage1-smoke' } },
    timeoutMs,
    vercelBypass,
  })

  const kbRes = await callJson({
    method: 'POST',
    url: `${baseUrl}/api/v1/voice-agents/runtime/bolna/kb/search`,
    headers: bridgeHeaders,
    body: { query: 'pricing', topK: 3 },
    timeoutMs,
    vercelBypass,
  })

  const eventsRes = await callJson({
    method: 'POST',
    url: `${baseUrl}/api/v1/voice-agents/runtime/bolna/events`,
    headers: bridgeHeaders,
    body: {
      kind: 'transcript_final',
      role: 'user',
      text: 'stage1 smoke utterance',
      timings: { first_audio_ms: 850, tts_first_chunk_ms: 900 },
    },
    timeoutMs,
    vercelBypass,
  })

  const checks = [
    {
      name: 'tools_execute_ping',
      ok: toolRes.ok && toolRes.json?.ok === true,
      detail: `status=${toolRes.status ?? 'ERR'}`,
    },
    {
      name: 'kb_search_shape',
      ok: kbRes.ok && Array.isArray(kbRes.json?.results),
      detail: `status=${kbRes.status ?? 'ERR'} results=${kbRes.json?.results?.length ?? 'n/a'}`,
    },
    {
      name: 'events_transcript_final',
      ok: eventsRes.ok && eventsRes.json?.ok === true,
      detail: `status=${eventsRes.status ?? 'ERR'}`,
    },
  ]

  const allOk = checks.every((c) => c.ok)
  lines.push('## Checks', '')
  for (const c of checks) {
    lines.push(`- ${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
  }
  lines.push('', '## Raw', '')
  for (const [label, res] of [
    ['tools/execute', toolRes],
    ['kb/search', kbRes],
    ['events', eventsRes],
  ]) {
    lines.push(`### ${label}`, '', '```json', JSON.stringify(res.json ?? res.bodyText, null, 2), '```', '')
  }

  writeFileSync(outputPath, `${lines.join('\n')}\n`)
  console.log(JSON.stringify({ ok: allOk, outputPath }, null, 2))
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
