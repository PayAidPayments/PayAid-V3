#!/usr/bin/env node
/**
 * Fail fast when local BOLNA_BRIDGE_SECRET does not match deployment/bolna/.env or Vercel.
 * Does not print secret values.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { fetchVercelEnvPlaintext, looksLikePlaintextSecret } from './lib/fetch-vercel-env-plaintext.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

function parseKey(file, key) {
  if (!existsSync(file)) return ''
  const t = readFileSync(file, 'utf8')
  const m = t.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return m ? m[1].replace(/^"|"$/g, '').trim() : ''
}

const local = parseKey(path.join(root, '.env.local'), 'BOLNA_BRIDGE_SECRET') || process.env.BOLNA_BRIDGE_SECRET || ''
const sidecar = parseKey(path.join(root, 'deployment/bolna/.env'), 'BOLNA_BRIDGE_SECRET')

let vercelPlain = ''
let vercelMatch = null
try {
  vercelPlain = await fetchVercelEnvPlaintext('BOLNA_BRIDGE_SECRET')
  if (vercelPlain) vercelMatch = local === vercelPlain
} catch {
  vercelMatch = null
}

const localLooksPlain = looksLikePlaintextSecret(local)
const sidecarMatch = !sidecar || local === sidecar
const ok =
  localLooksPlain &&
  sidecarMatch &&
  vercelMatch !== false &&
  (vercelPlain ? looksLikePlaintextSecret(vercelPlain) : true)

console.log(
  JSON.stringify(
    {
      ok,
      localLen: local.length,
      localLooksPlain,
      sidecarLen: sidecar.length,
      sidecarMatch,
      vercelPlainLen: vercelPlain.length,
      vercelMatch,
      fix: !ok
        ? !localLooksPlain
          ? 'Run npm run voice-agent:pull-vercel-bridge-secret (or restore a 16–256 char plaintext secret; do not paste Vercel ciphertext blobs)'
          : 'Restore .env.local BOLNA_BRIDGE_SECRET to match Vercel plaintext or run voice-agent:pull-vercel-bridge-secret — see VOICE_AGENT_STAGE1_VERCEL_ENV_RUNBOOK.md'
        : null,
    },
    null,
    2,
  ),
)
process.exit(ok ? 0 : 1)
