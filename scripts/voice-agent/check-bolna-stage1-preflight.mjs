import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value && String(value).trim()) return String(value).trim()
  }
  return ''
}

function parseDotEnvFile(filePath) {
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

function hasTruthyValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function mask(value) {
  if (!value) return '[missing]'
  if (value.length <= 8) return '********'
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

function check(name, ok, detail) {
  return { name, ok, detail }
}

const skipTwilio =
  process.argv.includes('--skip-twilio') || process.env.BOLNA_PREFLIGHT_SKIP_TWILIO === '1'

async function main() {
  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'voice-agent')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-bolna-stage1-preflight.md`)

  const bolnaEnvPath = path.join(process.cwd(), 'deployment', 'bolna', '.env')
  const bolnaEnv = parseDotEnvFile(bolnaEnvPath)

  const appChecks = []
  const sidecarChecks = []
  const consistencyChecks = []

  const appFlag = getEnv('VOICE_AGENT_BOLNA_ENABLED')
  const appBridgeSecret = getEnv('BOLNA_BRIDGE_SECRET')
  const appApiBase = getEnv('BOLNA_API_BASE_URL')
  const appWsHost = getEnv('BOLNA_PUBLIC_WS_HOST')
  const appBridgeBase = getEnv('PAYAID_BRIDGE_BASE_URL')

  appChecks.push(
    check(
      'app.voice_agent_bolna_enabled',
      appFlag === '1',
      `VOICE_AGENT_BOLNA_ENABLED=${appFlag || '[unset]'} (must be "1")`,
    ),
    check(
      'app.bolna_bridge_secret',
      hasTruthyValue(appBridgeSecret) && appBridgeSecret.length >= 16,
      `BOLNA_BRIDGE_SECRET length=${appBridgeSecret ? appBridgeSecret.length : 0} (must be >=16)`,
    ),
    check(
      'app.bolna_api_base_url',
      hasTruthyValue(appApiBase),
      `BOLNA_API_BASE_URL=${appApiBase || '[unset]'}`,
    ),
    check(
      'app.bolna_public_ws_host',
      hasTruthyValue(appWsHost),
      `BOLNA_PUBLIC_WS_HOST=${appWsHost || '[unset]'}`,
    ),
    check(
      'app.bridge_base_url',
      hasTruthyValue(appBridgeBase),
      `PAYAID_BRIDGE_BASE_URL=${appBridgeBase || '[unset]'}`,
    ),
  )

  sidecarChecks.push(
    check(
      'sidecar.env_file_present',
      existsSync(bolnaEnvPath),
      `deployment/bolna/.env ${existsSync(bolnaEnvPath) ? 'found' : 'missing'}`,
    ),
    check(
      'sidecar.bridge_secret',
      hasTruthyValue(bolnaEnv.BOLNA_BRIDGE_SECRET),
      `BOLNA_BRIDGE_SECRET=${mask(bolnaEnv.BOLNA_BRIDGE_SECRET || '')}`,
    ),
    check(
      'sidecar.twilio_sid',
      hasTruthyValue(bolnaEnv.TWILIO_ACCOUNT_SID),
      `TWILIO_ACCOUNT_SID=${mask(bolnaEnv.TWILIO_ACCOUNT_SID || '')}`,
    ),
    check(
      'sidecar.twilio_token',
      hasTruthyValue(bolnaEnv.TWILIO_AUTH_TOKEN),
      `TWILIO_AUTH_TOKEN=${mask(bolnaEnv.TWILIO_AUTH_TOKEN || '')}`,
    ),
    check(
      'sidecar.twilio_number',
      hasTruthyValue(bolnaEnv.TWILIO_PHONE_NUMBER),
      `TWILIO_PHONE_NUMBER=${bolnaEnv.TWILIO_PHONE_NUMBER || '[missing]'}`,
    ),
    check(
      'sidecar.asr_provider_key',
      hasTruthyValue(bolnaEnv.DEEPGRAM_AUTH_TOKEN) || hasTruthyValue(bolnaEnv.SARVAM_API_KEY),
      `DEEPGRAM_AUTH_TOKEN=${hasTruthyValue(bolnaEnv.DEEPGRAM_AUTH_TOKEN) ? 'set' : 'missing'}, SARVAM_API_KEY=${hasTruthyValue(bolnaEnv.SARVAM_API_KEY) ? 'set' : 'missing'}`,
    ),
    check(
      'sidecar.llm_provider_key',
      hasTruthyValue(bolnaEnv.GROQ_API_KEY) || hasTruthyValue(bolnaEnv.OPENAI_API_KEY),
      `GROQ_API_KEY=${hasTruthyValue(bolnaEnv.GROQ_API_KEY) ? 'set' : 'missing'}, OPENAI_API_KEY=${hasTruthyValue(bolnaEnv.OPENAI_API_KEY) ? 'set' : 'missing'}`,
    ),
    check(
      'sidecar.tts_provider_key',
      hasTruthyValue(bolnaEnv.ELEVENLABS_API_KEY) ||
        hasTruthyValue(bolnaEnv.CARTESIA_API_KEY) ||
        hasTruthyValue(bolnaEnv.SMALLEST_API_KEY) ||
        hasTruthyValue(bolnaEnv.SARVAM_TTS_API_KEY) ||
        hasTruthyValue(bolnaEnv.SARVAM_API_KEY),
      `ELEVENLABS=${hasTruthyValue(bolnaEnv.ELEVENLABS_API_KEY) ? 'set' : 'missing'}, CARTESIA=${hasTruthyValue(bolnaEnv.CARTESIA_API_KEY) ? 'set' : 'missing'}, SMALLEST=${hasTruthyValue(bolnaEnv.SMALLEST_API_KEY) ? 'set' : 'missing'}, SARVAM=${hasTruthyValue(bolnaEnv.SARVAM_API_KEY) || hasTruthyValue(bolnaEnv.SARVAM_TTS_API_KEY) ? 'set' : 'missing'}`,
    ),
  )

  consistencyChecks.push(
    check(
      'consistency.bridge_secret_match',
      hasTruthyValue(appBridgeSecret) &&
        hasTruthyValue(bolnaEnv.BOLNA_BRIDGE_SECRET) &&
        appBridgeSecret === bolnaEnv.BOLNA_BRIDGE_SECRET,
      `app=${mask(appBridgeSecret)} sidecar=${mask(bolnaEnv.BOLNA_BRIDGE_SECRET || '')}`,
    ),
  )

  const twilioNames = new Set(['sidecar.twilio_sid', 'sidecar.twilio_token', 'sidecar.twilio_number'])
  const allChecks = [...appChecks, ...sidecarChecks, ...consistencyChecks]
  const failed = allChecks.filter((c) => !c.ok && !(skipTwilio && twilioNames.has(c.name)))
  const passed = allChecks.length - failed.length

  const lines = []
  lines.push('# Bolna Stage 1 Preflight')
  lines.push('')
  lines.push(`- Timestamp: ${iso}`)
  lines.push(`- Workspace: ${process.cwd()}`)
  lines.push(`- Sidecar env file: ${bolnaEnvPath}`)
  if (skipTwilio) lines.push('- Note: Twilio checks skipped (--skip-twilio, Stage 2 non-telephony validation)')
  lines.push('')
  lines.push('## App checks')
  lines.push('')
  for (const c of appChecks) lines.push(`- ${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
  lines.push('')
  lines.push('## Sidecar checks')
  lines.push('')
  for (const c of sidecarChecks) lines.push(`- ${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
  lines.push('')
  lines.push('## Consistency checks')
  lines.push('')
  for (const c of consistencyChecks) lines.push(`- ${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
  lines.push('')
  lines.push('## Verdict')
  lines.push('')
  lines.push(`- Passed: ${passed}/${allChecks.length}`)
  lines.push(`- Failed: ${failed.length}`)
  lines.push(`- Stage 1 preflight: ${failed.length === 0 ? 'READY' : 'BLOCKED'}`)
  if (failed.length > 0) {
    lines.push('')
    lines.push('## Blocking items')
    lines.push('')
    for (const c of failed) lines.push(`- ${c.name}: ${c.detail}`)
  }

  writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(JSON.stringify({ ok: failed.length === 0, outputPath, failed: failed.map((c) => c.name) }, null, 2))
  process.exit(failed.length === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
