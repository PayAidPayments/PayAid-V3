#!/usr/bin/env node
/**
 * Sarvam STT smoke for browser-live server path (TTS round-trip → sarvamStt).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const phrase = process.env.SARVAM_STT_SMOKE_PHRASE || 'Hello, this is a speech to text test.'
const language = process.env.SARVAM_STT_SMOKE_LANG || 'en'

async function main() {
  const { sarvamTts, sarvamStt, isSarvamConfigured } = await import('../../lib/voice-agent/sarvam.ts')
  const iso = new Date().toISOString()
  const stamp = iso.replace(/[:.]/g, '-')
  const evidenceDir = path.join(root, 'docs', 'evidence', 'voice-agent')
  mkdirSync(evidenceDir, { recursive: true })
  const evidencePath = path.join(evidenceDir, `${stamp}-sarvam-stt-browser-live-smoke.md`)

  if (!isSarvamConfigured()) {
    const msg = 'FAIL: SARVAM_API_KEY not set'
    writeFileSync(evidencePath, `# Sarvam STT browser-live smoke\n\n- ${iso}\n- ${msg}\n`)
    console.log(JSON.stringify({ ok: false, evidencePath, error: msg }, null, 2))
    process.exit(1)
  }

  const audio = await sarvamTts(phrase, language, {
    outputCodec: 'mp3',
    signal: AbortSignal.timeout(45_000),
  })
  const stt = await sarvamStt(audio, {
    mime: 'audio/mpeg',
    language,
    signal: AbortSignal.timeout(45_000),
  })
  const ok = stt.text.length >= 3
  const lines = [
    '# Sarvam STT browser-live smoke',
    '',
    `- Timestamp: ${iso}`,
    `- Phrase: ${phrase}`,
    `- TTS bytes: ${audio.length}`,
    `- STT transcript: ${stt.text}`,
    `- Result: ${ok ? 'PASS' : 'FAIL'}`,
    '',
  ]
  writeFileSync(evidencePath, `${lines.join('\n')}\n`)
  console.log(
    JSON.stringify(
      {
        ok,
        evidencePath,
        phrase,
        ttsBytes: audio.length,
        transcript: stt.text,
        language: stt.language,
      },
      null,
      2,
    ),
  )
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
