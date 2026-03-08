/**
 * Test Coqui TTS connectivity.
 * Uses .env: COQUI_TTS_URL
 *
 * Easiest: use your existing PayAid TTS (already running on 7861):
 *   COQUI_TTS_URL=http://localhost:7861/synthesize
 *
 * Or standalone Coqui image (fix name conflict first):
 *   docker rm -f payaid-tts
 *   docker run -d --name payaid-tts -p 5002:5002 ghcr.io/coqui-ai/tts-cpu:latest
 *   COQUI_TTS_URL=http://localhost:5002/api/tts
 *
 * Run: npm run test:coqui
 */

import 'dotenv/config'
import { writeFileSync } from 'fs'
import { synthesizeWithCoquiDocker, isCoquiDockerConfigured } from '../lib/voice-agent/coqui-docker-tts'

const url = process.env.COQUI_TTS_URL?.trim() || '(not set)'

console.log('COQUI_TTS_URL:', url)
console.log('Configured:', isCoquiDockerConfigured())
console.log('')

if (!isCoquiDockerConfigured()) {
  console.error('Set COQUI_TTS_URL in .env.')
  console.error('  Option A (use existing PayAid TTS):  COQUI_TTS_URL=http://localhost:7861/synthesize')
  console.error('  Option B (standalone):               docker rm -f payaid-tts  then  docker run -d --name payaid-tts -p 5002:5002 ghcr.io/coqui-ai/tts-cpu:latest  and  COQUI_TTS_URL=http://localhost:5002/api/tts')
  process.exit(1)
}

synthesizeWithCoquiDocker('Namaste Teja ji, PayAid se Priya bol rahi hun', 'hi')
  .then((buffer) => {
    const outPath = 'test-coqui-out.wav'
    writeFileSync(outPath, buffer)
    console.log('OK (200). Wrote', outPath)
  })
  .catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Request failed:', msg)
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
      console.error('\nTTS not reachable. Try:')
      console.error('  COQUI_TTS_URL=http://localhost:7861/synthesize  (use existing payaid-text-to-speech)')
      console.error('  Or: docker rm -f payaid-tts  then  docker run -d --name payaid-tts -p 5002:5002 ghcr.io/coqui-ai/tts-cpu:latest')
    }
    process.exit(1)
  })
