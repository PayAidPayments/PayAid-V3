#!/usr/bin/env node
/**
 * Stage 2: post transcript_final events for hi/ta/te through live Bolna bridge (no Twilio).
 * Writes docs/evidence/voice-agent/*-bolna-stage2-sarvam-bridge-smoke.md
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
const outputDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-bolna-stage2-sarvam-bridge-smoke.md`)

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

function mintJwt(tenantId, agentId, callSid) {
  const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const script = path.join(root, 'scripts/voice-agent/mint-bolna-call-jwt.ts')
  const r = spawnSync(process.execPath, [tsx, script, tenantId, agentId, callSid], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  if (r.status !== 0) throw new Error(r.stderr || 'mint jwt failed')
  return (r.stdout || '').trim()
}

const baseUrl = getEnv('BASE_URL', 'PAYAID_BRIDGE_BASE_URL').replace(/\/$/, '')
const bridgeSecret = getEnv('BOLNA_BRIDGE_SECRET')
const tenantId = getEnv('TENANT_ID') || 'cmjptk2mw0000aocw31u48n64'
const agentId = getEnv('VOICE_AGENT_BOLNA_SMOKE_AGENT_ID') || 'va_stage1_bolna_smoke'
const bypass = getEnv('VERCEL_PROTECTION_BYPASS', 'VERCEL_AUTOMATION_BYPASS_SECRET')
const timeoutMs = Number(process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '20000')

const cases = [
  { language: 'hi', text: 'stage2 hindi smoke utterance', first_audio_ms: 840 },
  { language: 'ta', text: 'stage2 tamil smoke utterance', first_audio_ms: 880 },
  { language: 'te', text: 'stage2 telugu smoke utterance', first_audio_ms: 820 },
]

const lines = ['# Bolna Stage 2 Sarvam bridge smoke (events)', '', `- Timestamp: ${iso}`, `- Base URL: ${baseUrl}`, '']

if (!baseUrl || !bridgeSecret) {
  lines.push('- FAIL: BASE_URL and BOLNA_BRIDGE_SECRET required')
  writeFileSync(outputPath, `${lines.join('\n')}\n`)
  process.exit(1)
}

const results = []
for (const c of cases) {
  const callSid = `CA_S2_${c.language.toUpperCase()}_${Date.now()}`
  let jwt
  try {
    jwt = mintJwt(tenantId, agentId, callSid)
  } catch (e) {
    results.push({ language: c.language, ok: false, error: String(e) })
    continue
  }
  const url = withVercelBypass(`${baseUrl}/api/v1/voice-agents/runtime/bolna/events`, bypass)
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-PayAid-Bridge-Secret': bridgeSecret,
        Authorization: `Bearer ${jwt}`,
        ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
      },
      body: JSON.stringify({
        kind: 'transcript_final',
        role: 'user',
        text: c.text,
        language: c.language,
        timings: { first_audio_ms: c.first_audio_ms, tts_first_chunk_ms: c.first_audio_ms + 40 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    results.push({ language: c.language, ok: false, error: e instanceof Error ? e.message : String(e) })
    continue
  }
  const json = await res.json().catch(() => null)
  results.push({
    language: c.language,
    ok: res.ok && json?.ok === true,
    status: res.status,
    callSid,
    body: json,
  })
}

lines.push('## Checks', '')
for (const r of results) {
  lines.push(`- ${r.ok ? 'PASS' : 'FAIL'} ${r.language}: status=${r.status ?? 'ERR'} callSid=${r.callSid ?? 'n/a'}`)
}
lines.push('', '## Raw', '', '```json', JSON.stringify(results, null, 2), '```', '')
writeFileSync(outputPath, `${lines.join('\n')}\n`)

const ok = results.every((r) => r.ok)
console.log(JSON.stringify({ ok, outputPath, results: results.map((r) => ({ language: r.language, ok: r.ok })) }, null, 2))
process.exit(ok ? 0 : 1)
