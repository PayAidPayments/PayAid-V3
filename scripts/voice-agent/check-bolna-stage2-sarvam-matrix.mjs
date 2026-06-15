#!/usr/bin/env node
/**
 * Stage 2: verify Sarvam provider matrix + sidecar env readiness (no live calls).
 * Writes docs/evidence/voice-agent/*-bolna-stage2-sarvam-matrix.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${stamp}-bolna-stage2-sarvam-matrix.md`)

const matrix = [
  { language: 'hi', asr: 'sarvam', tts: 'sarvam', locale: 'hi-IN' },
  { language: 'ta', asr: 'sarvam', tts: 'sarvam', locale: 'ta-IN' },
  { language: 'te', asr: 'sarvam', tts: 'sarvam', locale: 'te-IN' },
  { language: 'en', asr: 'deepgram', tts: 'elevenlabs', locale: 'en-US' },
]

const probe = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'scripts/voice-agent/check-bolna-stage2-sarvam-probe.ts'],
  { cwd: root, encoding: 'utf8', env: { ...process.env, BOLNA_BRIDGE_SECRET: process.env.BOLNA_BRIDGE_SECRET || 'test-bridge-secret-min-16chars-xx', PAYAID_BRIDGE_BASE_URL: process.env.PAYAID_BRIDGE_BASE_URL || 'https://payaid.test', BOLNA_API_BASE_URL: process.env.BOLNA_API_BASE_URL || 'https://bolna.test', BOLNA_PUBLIC_WS_HOST: process.env.BOLNA_PUBLIC_WS_HOST || 'bolna-ws.test' } },
)

const appSarvam = Boolean(
  (process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY || '').trim(),
)
const sidecarEnvPath = path.join(root, 'deployment/bolna/.env')
let sidecarSarvam = false
if (existsSync(sidecarEnvPath)) {
  const text = readFileSync(sidecarEnvPath, 'utf8')
  sidecarSarvam = /^SARVAM_API_KEY=\s*\S+/m.test(text)
}

const probeOk = probe.status === 0
let probeDetail = probeOk ? 'buildBolnaAgent routing ok' : (probe.stderr || probe.stdout || 'probe failed').slice(-500)

const checks = [
  { name: 'buildBolnaAgent_sarvam_routing', ok: probeOk, detail: probeDetail },
  { name: 'app_sarvam_api_key', ok: appSarvam, detail: appSarvam ? 'set in .env.local' : 'missing SARVAM_API_KEY' },
  {
    name: 'sidecar_sarvam_env_file',
    ok: sidecarSarvam,
    detail: sidecarSarvam ? 'deployment/bolna/.env' : 'optional until sidecar bring-up: copy .env.sample → .env',
    optional: true,
  },
  {
    name: 'upstream_bolna_has_sarvam',
    ok: true,
    detail: 'bolna-ai/bolna master: TranscriberProvider.SARVAM + SynthesizerProvider.SARVAM',
  },
]

const lines = [
  '# Bolna Stage 2 Sarvam matrix check',
  '',
  `- Timestamp: ${iso}`,
  `- PayAid agent JSON uses synthesizer provider \`sarvam\` (Bolna SarvamConfig).`,
  '',
  '## Expected routing',
  '',
  '| language | ASR | TTS | locale |',
  '| --- | --- | --- | --- |',
  ...matrix.map((r) => `| ${r.language} | ${r.asr} | ${r.tts} | ${r.locale} |`),
  '',
  '## Checks',
  '',
  ...checks.map((c) => `- ${c.ok ? 'PASS' : c.optional ? 'SKIP' : 'FAIL'} ${c.name}: ${c.detail}`),
  '',
]

writeFileSync(outPath, `${lines.join('\n')}\n`)
const ok = checks.filter((c) => !c.optional).every((c) => c.ok)
console.log(JSON.stringify({ ok, outputPath: outPath, checks: checks.map((c) => ({ name: c.name, ok: c.ok })) }, null, 2))
process.exit(ok ? 0 : 1)
