import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const raw = readFileSync(filePath, 'utf8')
  const out = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    out[key] = value
  }
  return out
}

function hasValue(v) {
  return typeof v === 'string' && v.trim().length > 0
}

const appEnvPath = path.join(process.cwd(), '.env.local')
const sidecarEnvPath = path.join(process.cwd(), 'deployment', 'bolna', '.env')

const appEnv = parseEnvFile(appEnvPath)
const sidecarEnv = parseEnvFile(sidecarEnvPath)

// Stage 1 baseline: English-only sandbox on Deepgram + Groq + ElevenLabs.
const checks = [
  { name: 'app.voice_agent_bolna_enabled', ok: appEnv.VOICE_AGENT_BOLNA_ENABLED === '1', detail: 'Set VOICE_AGENT_BOLNA_ENABLED=1 in .env.local' },
  { name: 'app.bridge_secret', ok: hasValue(appEnv.BOLNA_BRIDGE_SECRET), detail: 'Set BOLNA_BRIDGE_SECRET in .env.local' },
  { name: 'app.bolna_api_base_url', ok: hasValue(appEnv.BOLNA_API_BASE_URL), detail: 'Set BOLNA_API_BASE_URL in .env.local' },
  { name: 'app.bolna_public_ws_host', ok: hasValue(appEnv.BOLNA_PUBLIC_WS_HOST), detail: 'Set BOLNA_PUBLIC_WS_HOST in .env.local' },
  { name: 'app.payaid_bridge_base_url', ok: hasValue(appEnv.PAYAID_BRIDGE_BASE_URL), detail: 'Set PAYAID_BRIDGE_BASE_URL in .env.local' },

  { name: 'sidecar.twilio_sid', ok: hasValue(sidecarEnv.TWILIO_ACCOUNT_SID), detail: 'Set TWILIO_ACCOUNT_SID in deployment/bolna/.env' },
  { name: 'sidecar.twilio_token', ok: hasValue(sidecarEnv.TWILIO_AUTH_TOKEN), detail: 'Set TWILIO_AUTH_TOKEN in deployment/bolna/.env' },
  { name: 'sidecar.twilio_number', ok: hasValue(sidecarEnv.TWILIO_PHONE_NUMBER), detail: 'Set TWILIO_PHONE_NUMBER in deployment/bolna/.env' },
  { name: 'sidecar.deepgram', ok: hasValue(sidecarEnv.DEEPGRAM_AUTH_TOKEN), detail: 'Set DEEPGRAM_AUTH_TOKEN in deployment/bolna/.env' },
  { name: 'sidecar.groq', ok: hasValue(sidecarEnv.GROQ_API_KEY), detail: 'Set GROQ_API_KEY in deployment/bolna/.env' },
  { name: 'sidecar.elevenlabs', ok: hasValue(sidecarEnv.ELEVENLABS_API_KEY), detail: 'Set ELEVENLABS_API_KEY in deployment/bolna/.env' },
  { name: 'sidecar.bridge_secret', ok: hasValue(sidecarEnv.BOLNA_BRIDGE_SECRET), detail: 'Set BOLNA_BRIDGE_SECRET in deployment/bolna/.env' },
  { name: 'sidecar.bridge_base_url', ok: hasValue(sidecarEnv.PAYAID_BRIDGE_BASE_URL), detail: 'Set PAYAID_BRIDGE_BASE_URL in deployment/bolna/.env' },
  {
    name: 'bridge_secret_parity',
    ok: hasValue(appEnv.BOLNA_BRIDGE_SECRET) && hasValue(sidecarEnv.BOLNA_BRIDGE_SECRET) && appEnv.BOLNA_BRIDGE_SECRET === sidecarEnv.BOLNA_BRIDGE_SECRET,
    detail: 'BOLNA_BRIDGE_SECRET must match exactly between .env.local and deployment/bolna/.env',
  },
]

const failed = checks.filter((c) => !c.ok)
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      baseline: 'deepgram+groq+elevenlabs',
      appEnvPath,
      sidecarEnvPath,
      passed: checks.length - failed.length,
      total: checks.length,
      failed: failed.map((f) => ({ name: f.name, detail: f.detail })),
    },
    null,
    2,
  ),
)

process.exit(failed.length === 0 ? 0 : 1)
