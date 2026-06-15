#!/usr/bin/env node
/**
 * Stage 1 regression helper: trigger bridge/analytics traffic, then scan Vercel runtime logs.
 * Uses request/function logs (not build logs). Writes evidence under docs/evidence/voice-agent/.
 *
 * Usage:
 *   node scripts/voice-agent/check-stage1-vercel-runtime-logs.mjs [--trigger=bridge|analytics|both] [--timeout-ms=45000]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { VOICE_RUNTIME_LOG_PATTERNS } from './lib/vercel-voice-env-contract.mjs'
import { readVercelCliToken, sanitizeVercelToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const triggerArg = process.argv.find((a) => a.startsWith('--trigger='))
const trigger = (triggerArg?.split('=')[1] || process.env.VOICE_STAGE1_LOG_TRIGGER || 'both').toLowerCase()
const timeoutMs = Number(
  process.argv.find((a) => a.startsWith('--timeout-ms='))?.split('=')[1] ||
    process.env.VOICE_STAGE1_LOG_TIMEOUT_MS ||
    '45000',
)

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outputDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-stage1-vercel-runtime-logs.md`)

function runNode(script, extraEnv = {}) {
  return spawnSync('node', [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    timeout: Math.max(timeoutMs, 120000),
  })
}

const baseUrl = (process.env.BASE_URL || process.env.PAYAID_BRIDGE_BASE_URL || '').replace(/\/$/, '')
if (!baseUrl) {
  console.error(JSON.stringify({ ok: false, error: 'BASE_URL missing — run voice-agent:sync-stage1-vercel-env' }))
  process.exit(1)
}

const deploymentHost = baseUrl.replace(/^https?:\/\//, '')
const lines = [
  '# Stage 1 Vercel runtime logs',
  '',
  `- Timestamp: ${iso}`,
  `- Deployment host: ${deploymentHost}`,
  `- Trigger: ${trigger}`,
  `- Timeout: ${timeoutMs}ms`,
  '',
]

const triggerResults = []
if (trigger === 'bridge' || trigger === 'both') {
  const smoke = runNode('scripts/voice-agent/bolna-bridge-stage1-smoke.mjs')
  triggerResults.push({
    name: 'bolna-bridge-stage1-smoke',
    status: smoke.status,
    stdout: (smoke.stdout || '').slice(-800),
    stderr: (smoke.stderr || '').slice(-400),
  })
}
if (trigger === 'analytics' || trigger === 'both') {
  const mint = runNode('scripts/voice-agent/mint-stage1-validation-auth-token.mjs')
  const token = (mint.stdout || '').trim()
  const env = token ? { AUTH_TOKEN: token, API_AUTH_TOKEN: token } : {}
  const latency = runNode('scripts/voice-agent/capture-bolna-latency-evidence.mjs', env)
  triggerResults.push({
    name: 'bolna-latency-evidence',
    status: latency.status,
    stdout: (latency.stdout || '').slice(-800),
    stderr: (latency.stderr || '').slice(-400),
  })
}

lines.push('## Trigger runs', '')
for (const t of triggerResults) {
  lines.push(`- ${t.name}: exit=${t.status ?? 'null'}`)
}
lines.push('')

const token = sanitizeVercelToken(process.env.VERCEL_TOKEN || readVercelCliToken())
const vercelJs = path.join(root, 'node_modules', 'vercel', 'dist', 'vc.js')
let logLines = []
let logSource = 'none'

if (token && deploymentHost) {
  await new Promise((r) => setTimeout(r, 2000))
  const patterns = [
    ...(trigger === 'analytics' ? VOICE_RUNTIME_LOG_PATTERNS.analytics : []),
    ...(trigger === 'bridge' ? VOICE_RUNTIME_LOG_PATTERNS.bridge : []),
    ...(trigger === 'both'
      ? [...VOICE_RUNTIME_LOG_PATTERNS.bridge, ...VOICE_RUNTIME_LOG_PATTERNS.analytics]
      : []),
  ]

  if (existsSync(vercelJs) && vercelCliWorks(vercelJs)) {
    logSource = 'vercel-cli'
    const proc = spawn(
      process.execPath,
      [vercelJs, 'logs', deploymentHost, '--token', token],
      { cwd: root, env: process.env },
    )
    let buf = ''
    const onData = (chunk) => {
      buf += chunk.toString()
      const parts = buf.split('\n')
      buf = parts.pop() || ''
      for (const line of parts) {
        if (line.trim()) logLines.push(line.trim())
        if (logLines.length > 500) proc.kill()
      }
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        proc.kill()
        resolve()
      }, timeoutMs)
      proc.on('close', () => {
        clearTimeout(timer)
        resolve()
      })
    })
    if (buf.trim()) logLines.push(buf.trim())
  } else {
    logSource = 'api-skipped'
    lines.push('- Vercel CLI not found; install `vercel` at repo root for live log stream.', '')
  }

  const matched = logLines.filter((line) => patterns.some((re) => re.test(line)))
  const firstError =
    matched.find((l) => /error|fail|P20|Invalid|Analytics error/i.test(l)) || matched[0] || null

  lines.push('## Runtime log scan', '')
  lines.push(`- Log source: ${logSource}`)
  lines.push(`- Lines captured: ${logLines.length}`)
  lines.push(`- Pattern matches: ${matched.length}`)
  lines.push(`- First relevant line: ${firstError ? `\`${firstError.slice(0, 500)}\`` : '[none in window]'}`)
  lines.push('')
  if (matched.length) {
    lines.push('### Matched lines (up to 12)', '')
    for (const m of matched.slice(0, 12)) {
      lines.push(`- \`${m.slice(0, 400)}\``)
    }
    lines.push('')
  }
} else {
  lines.push('## Runtime log scan', '', '- Skipped: VERCEL_TOKEN or deployment host missing', '')
}

writeFileSync(outputPath, `${lines.join('\n')}\n`)

const triggersOk = triggerResults.every((t) => t.status === 0)

console.log(
  JSON.stringify(
    {
      ok: triggersOk,
      outputPath,
      logSource,
      linesCaptured: logLines.length,
      redeployNote: 'Runtime logs reflect the current READY deployment only.',
    },
    null,
    2,
  ),
)

process.exit(triggersOk ? 0 : 1)

function vercelCliWorks(vercelJs) {
  try {
    return spawnSync(process.execPath, [vercelJs, '--version'], { encoding: 'utf8' }).status === 0
  } catch {
    return false
  }
}
