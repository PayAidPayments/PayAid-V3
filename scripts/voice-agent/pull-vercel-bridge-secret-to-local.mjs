#!/usr/bin/env node
/**
 * Pull production BOLNA_BRIDGE_SECRET from the voice Vercel project into .env.local.
 * Never prints the secret. Use when check-bridge-secret-parity reports vercelMatch: false.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { fetchVercelEnvPlaintext, looksLikePlaintextSecret } from './lib/fetch-vercel-env-plaintext.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const envPath = path.join(root, '.env.local')
dotenv.config({ path: envPath, quiet: true })

if (!existsSync(envPath)) {
  console.error(JSON.stringify({ ok: false, error: '.env.local missing' }, null, 2))
  process.exit(1)
}

let value = ''
try {
  value = await fetchVercelEnvPlaintext('BOLNA_BRIDGE_SECRET')
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: String(e.message || e) }, null, 2))
  process.exit(1)
}

if (!looksLikePlaintextSecret(value)) {
  console.error(
    JSON.stringify(
      { ok: false, error: 'BOLNA_BRIDGE_SECRET missing or too short on Vercel project' },
      null,
      2,
    ),
  )
  process.exit(1)
}

let text = readFileSync(envPath, 'utf8')
const line = `BOLNA_BRIDGE_SECRET=${value}`
const re = /^BOLNA_BRIDGE_SECRET=.*$/m
text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
writeFileSync(envPath, text.endsWith('\n') ? text : `${text}\n`)

const sidecarPath = path.join(root, 'deployment/bolna/.env')
if (existsSync(sidecarPath)) {
  let sidecarText = readFileSync(sidecarPath, 'utf8')
  sidecarText = /^BOLNA_BRIDGE_SECRET=.*$/m.test(sidecarText)
    ? sidecarText.replace(/^BOLNA_BRIDGE_SECRET=.*$/m, line)
    : `${sidecarText.trimEnd()}\n${line}\n`
  writeFileSync(sidecarPath, sidecarText.endsWith('\n') ? sidecarText : `${sidecarText}\n`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      updated: true,
      secretLen: value.length,
      next: [
        'npm run check:voice-agent:bridge-secret-parity',
        'npm run smoke:voice-agent:bolna-bridge-stage1',
      ],
      redeployNote:
        'If smoke still returns 401 after pull, production deployment may be stale — redeploy per VOICE_AGENT_STAGE1_VERCEL_ENV_RUNBOOK.md',
    },
    null,
    2,
  ),
)
