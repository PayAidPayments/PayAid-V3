#!/usr/bin/env node
/**
 * Stage 1 Vercel env sync (local + optional push).
 *
 * Default: pull READY deployment BASE_URL + protection bypass into .env.local.
 * --push-secrets: push BOLNA_BRIDGE_SECRET, DATABASE_URL, JWT_SECRET to the voice
 *   Vercel project (values from .env.local / .env; never printed). Requires redeploy.
 * --print: stdout BASE_URL and VERCEL_PROTECTION_BYPASS only.
 *
 * Canonical operator path: docs/VOICE_AGENT_STAGE1_VERCEL_ENV_RUNBOOK.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import { VOICE_VERCEL_REDEPLOY_NOTE } from './lib/vercel-voice-env-contract.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const envPath = path.join(root, '.env.local')
const printOnly = process.argv.includes('--print')
const pushSecrets = process.argv.includes('--push-secrets')

dotenv.config({ path: envPath, quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

if (pushSecrets) {
  const pushArgs = ['scripts/voice-agent/push-stage1-vercel-secrets.mjs']
  if (process.argv.includes('--dry-run')) pushArgs.push('--dry-run')
  const push = spawnSync('node', pushArgs, { cwd: root, encoding: 'utf8', stdio: 'inherit' })
  if (push.status !== 0) process.exit(push.status ?? 1)
  console.error(`\nNote: ${VOICE_VERCEL_REDEPLOY_NOTE}\n`)
}

const fetch = spawnSync('node', ['scripts/voice-agent/fetch-voice-vercel-runtime.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: process.env,
})
const stdout = fetch.stdout || ''
let meta = {}
const start = stdout.indexOf('{')
if (start >= 0) {
  let depth = 0
  for (let i = start; i < stdout.length; i++) {
    if (stdout[i] === '{') depth++
    if (stdout[i] === '}') depth--
    if (depth === 0) {
      meta = JSON.parse(stdout.slice(start, i + 1))
      break
    }
  }
}
const lines = stdout.split('\n')
const bypassLine = lines.find((l) => l.startsWith('VERCEL_PROTECTION_BYPASS='))
const baseLine = lines.find((l) => l.startsWith('BASE_URL='))

if (!meta.ok) {
  console.error(fetch.stderr || fetch.stdout)
  process.exit(1)
}

function normalizeBaseUrl(raw) {
  const v = String(raw || '')
    .trim()
    .replace(/^"|"$/g, '')
  if (!v) return ''
  return v.startsWith('http') ? v.replace(/\/$/, '') : `https://${v.replace(/\/$/, '')}`
}

const baseUrl = normalizeBaseUrl(
  baseLine?.split('=').slice(1).join('=') ||
    meta.recommendedBaseUrl ||
    meta.latestReadyUrl ||
    meta.productionUrl ||
    meta.latestDeploymentUrl ||
    '',
)
const bypass = (bypassLine?.split('=').slice(1).join('=').trim() || '').replace(/^"|"$/g, '')

if (printOnly) {
  if (baseUrl) console.log(`BASE_URL=${baseUrl}`)
  if (bypass) console.log(`VERCEL_PROTECTION_BYPASS=${bypass}`)
  process.exit(bypass && baseUrl ? 0 : 1)
}

if (!existsSync(envPath)) {
  console.error('.env.local missing')
  process.exit(1)
}

let text = readFileSync(envPath, 'utf8')
function upsert(key, value) {
  if (!value) return
  const line = `${key}="${value.replace(/"/g, '')}"`
  const re = new RegExp(`^${key}=.*$`, 'm')
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
}
if (baseUrl) {
  upsert('BASE_URL', baseUrl)
  upsert('PAYAID_BRIDGE_BASE_URL', baseUrl)
}
if (bypass) upsert('VERCEL_PROTECTION_BYPASS', bypass)

writeFileSync(envPath, text.endsWith('\n') ? text : `${text}\n`)
console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl: baseUrl || null,
      bypassSet: Boolean(bypass),
      payaidBridgeUpdated: Boolean(baseUrl),
      secretsPushed: pushSecrets,
      redeployNote: pushSecrets ? VOICE_VERCEL_REDEPLOY_NOTE : null,
      verifySecrets: 'npm run voice-agent:verify-stage1-vercel-env',
      runtimeLogs: 'npm run voice-agent:check-stage1-vercel-runtime-logs',
    },
    null,
    2,
  ),
)
