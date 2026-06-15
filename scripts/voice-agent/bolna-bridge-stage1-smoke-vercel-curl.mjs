#!/usr/bin/env node
/**
 * Bridge smoke via `vercel curl` (bypasses Deployment Protection SSO).
 * Requires: cd apps/voice && npx vercel link (project: voice)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const voiceDir = path.join(root, 'apps/voice')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const baseUrl = (
  process.env.BASE_URL ||
  process.env.PAYAID_BRIDGE_BASE_URL ||
  'https://voice-emrn0qy95-payaid-projects-a67c6b27.vercel.app'
).replace(/\/$/, '')

const bridgeSecret = process.env.BOLNA_BRIDGE_SECRET
const tenantId = process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.VOICE_AGENT_BOLNA_SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const callSid = process.env.VOICE_AGENT_BOLNA_SMOKE_CALL_SID || 'CA_STAGE1_SMOKE_LIVE'

if (!bridgeSecret) {
  console.error('BOLNA_BRIDGE_SECRET required')
  process.exit(1)
}

const mint = spawnSync(
  process.execPath,
  [
    path.join(root, 'node_modules/tsx/dist/cli.mjs'),
    path.join(root, 'scripts/voice-agent/mint-bolna-call-jwt.ts'),
    tenantId,
    agentId,
    callSid,
  ],
  { cwd: root, encoding: 'utf8', env: process.env },
)
const jwt = (mint.stdout || '').trim()
if (!jwt) {
  console.error('JWT mint failed', mint.stderr)
  process.exit(1)
}

function vercelCurl(method, urlPath, body) {
  const url = `${baseUrl}${urlPath}`
  const curlArgs = [
    '-X',
    method,
    '-H',
    `X-PayAid-Bridge-Secret: ${bridgeSecret}`,
    '-H',
    `Authorization: Bearer ${jwt}`,
    '-H',
    'Content-Type: application/json',
  ]
  if (body) curlArgs.push('-d', JSON.stringify(body))
  const args = ['vercel', 'curl', url, '--', ...curlArgs]
  const r = spawnSync('npx', args, {
    cwd: voiceDir,
    encoding: 'utf8',
    env: process.env,
    shell: process.platform === 'win32',
    timeout: 120000,
  })
  const out = `${r.stdout || ''}\n${r.stderr || ''}`.trim()
  const status = r.status ?? (r.error ? 1 : null)
  return { status, stdout: out || (r.error ? String(r.error.message) : ''), stderr: '' }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outPath = path.join(root, 'docs/evidence/voice-agent', `${stamp}-bolna-bridge-stage1-smoke-vercel-curl.md`)

const checks = [
  { name: 'tools_execute_ping', ...vercelCurl('POST', '/api/v1/voice-agents/runtime/bolna/tools/execute', { action: 'ping', args: { message: 'stage1-smoke' } }) },
  { name: 'kb_search', ...vercelCurl('POST', '/api/v1/voice-agents/runtime/bolna/kb/search', { query: 'pricing', topK: 3 }) },
  { name: 'events', ...vercelCurl('POST', '/api/v1/voice-agents/runtime/bolna/events', { kind: 'transcript_final', role: 'user', text: 'smoke', timings: { tts_first_chunk_ms: 750 } }) },
]

const lines = ['# Bolna Bridge Stage 1 Smoke (vercel curl)', '', `- BASE_URL: ${baseUrl}`, '']
let allOk = true
for (const c of checks) {
  const pass = c.status === 0 && !c.stdout.includes('Authentication Required') && (c.stdout.includes('"ok":true') || c.stdout.includes('"ok": true'))
  if (!pass) allOk = false
  lines.push(`- ${pass ? 'PASS' : 'FAIL'} ${c.name} (exit ${c.status})`, '```', c.stdout.slice(0, 1500), '```', '')
}

mkdirSync(path.dirname(outPath), { recursive: true })
writeFileSync(outPath, lines.join('\n'))
console.log(JSON.stringify({ ok: allOk, outputPath: outPath }, null, 2))
process.exit(allOk ? 0 : 1)
