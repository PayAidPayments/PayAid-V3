#!/usr/bin/env node
/**
 * Investor-week text-first preflight.
 * Runs the existing readiness snapshot and enforces text-first posture:
 * - TTS health is informational only
 * - Stub/offline/tunnel/local/live-demo blockers remain hard failures
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const run = spawnSync('node', ['scripts/voice-agent/status-browser-live-investor.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: process.env,
})

const stdout = (run.stdout || '').trim()
const stderr = (run.stderr || '').trim()

if (stderr) process.stderr.write(`${stderr}\n`)
if (!stdout) {
  console.error('preflight: status script returned no JSON output')
  process.exit(run.status || 1)
}

let parsed
try {
  parsed = JSON.parse(stdout)
} catch (error) {
  console.error('preflight: failed to parse status JSON output')
  console.error(stdout)
  process.exit(1)
}

const checks = Array.isArray(parsed.checks) ? parsed.checks : []
const blockers = Array.isArray(parsed.blockers) ? [...parsed.blockers] : []
const warnings = Array.isArray(parsed.warnings) ? [...parsed.warnings] : []

const ttsCheck = checks.find((c) => c?.name === 'tts')
if (ttsCheck && !ttsCheck.ok) {
  const provider = ttsCheck.body?.provider || 'auto'
  const attempts = Number.isFinite(ttsCheck.body?.attempts) ? ttsCheck.body.attempts : '?'
  const successCount = Number.isFinite(ttsCheck.body?.successCount) ? ttsCheck.body.successCount : '?'
  warnings.push(
    `Text-first mode active: TTS unhealthy (${successCount}/${attempts}, provider=${provider}) is non-blocking for investor week.`,
  )
}

const report = {
  mode: 'investor_text_first',
  ok: blockers.length === 0,
  blockers,
  warnings,
  checks,
  tunnelWss: parsed.tunnelWss || null,
  localWs: parsed.localWs || null,
  liveDemo: parsed.liveDemo || null,
  groqConfigured: !!parsed.groqConfigured,
  offlineRealEnv: !!parsed.offlineRealEnv,
  generatedAt: new Date().toISOString(),
}

console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
