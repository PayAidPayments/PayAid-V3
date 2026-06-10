import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const bridgeSecret =
  process.env.BOLNA_BRIDGE_SECRET ||
  'REPLACE_WITH_SHARED_SECRET_FROM_npm_run_voice-agent_generate-bolna-bridge-secret'

const appStub = `# Stage 1 app env stub (voice runtime + bridge wiring)
VOICE_AGENT_BOLNA_ENABLED=1
BOLNA_API_BASE_URL=http://bolna-app:5001
BOLNA_PUBLIC_WS_HOST=bolna.your-domain.com
BOLNA_BRIDGE_SECRET=${bridgeSecret}
PAYAID_BRIDGE_BASE_URL=https://app.your-domain.com

# Optional (recommended)
GROQ_API_KEY=
OPENAI_API_KEY=
`

const sidecarStub = `# Stage 1 sidecar env stub (deployment/bolna/.env)
PAYAID_BRIDGE_BASE_URL=https://app.your-domain.com
BOLNA_BRIDGE_SECRET=${bridgeSecret}

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ASR (pick one)
DEEPGRAM_AUTH_TOKEN=
SARVAM_API_KEY=

# LLM (pick one)
GROQ_API_KEY=
OPENAI_API_KEY=

# TTS (pick one)
ELEVENLABS_API_KEY=
CARTESIA_API_KEY=
SMALLEST_API_KEY=
SARVAM_TTS_API_KEY=
`

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'voice-agent')
mkdirSync(outDir, { recursive: true })

const appOut = path.join(outDir, 'bolna-stage1-app-env.stub')
const sidecarOut = path.join(outDir, 'bolna-stage1-sidecar-env.stub')

writeFileSync(appOut, appStub, 'utf8')
writeFileSync(sidecarOut, sidecarStub, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: true,
      bridgeSecretSource: process.env.BOLNA_BRIDGE_SECRET ? 'env' : 'placeholder',
      appOut,
      sidecarOut,
    },
    null,
    2,
  ),
)
