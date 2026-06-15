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

const envPath = path.join(process.cwd(), 'deployment', 'bolna', '.env')
const env = parseEnvFile(envPath)

const checks = [
  {
    name: 'twilio_sid',
    ok: hasValue(env.TWILIO_ACCOUNT_SID),
    detail: 'TWILIO_ACCOUNT_SID is required',
  },
  {
    name: 'twilio_token',
    ok: hasValue(env.TWILIO_AUTH_TOKEN),
    detail: 'TWILIO_AUTH_TOKEN is required',
  },
  {
    name: 'twilio_number',
    ok: hasValue(env.TWILIO_PHONE_NUMBER),
    detail: 'TWILIO_PHONE_NUMBER is required',
  },
  {
    name: 'asr_provider',
    ok: hasValue(env.DEEPGRAM_AUTH_TOKEN) || hasValue(env.SARVAM_API_KEY),
    detail: 'Set at least one ASR key: DEEPGRAM_AUTH_TOKEN or SARVAM_API_KEY',
  },
  {
    name: 'llm_provider',
    ok: hasValue(env.GROQ_API_KEY) || hasValue(env.OPENAI_API_KEY),
    detail: 'Set at least one LLM key: GROQ_API_KEY or OPENAI_API_KEY',
  },
  {
    name: 'tts_provider',
    ok:
      hasValue(env.ELEVENLABS_API_KEY) ||
      hasValue(env.CARTESIA_API_KEY) ||
      hasValue(env.SMALLEST_API_KEY) ||
      hasValue(env.SARVAM_TTS_API_KEY) ||
      hasValue(env.SARVAM_API_KEY),
    detail:
      'Set at least one TTS key: ELEVENLABS_API_KEY, CARTESIA_API_KEY, SMALLEST_API_KEY, or SARVAM (SARVAM_TTS_API_KEY / SARVAM_API_KEY)',
  },
]

const failed = checks.filter((c) => !c.ok)
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      envPath,
      passed: checks.length - failed.length,
      total: checks.length,
      failed: failed.map((f) => ({ name: f.name, detail: f.detail })),
    },
    null,
    2,
  ),
)

process.exit(failed.length === 0 ? 0 : 1)
