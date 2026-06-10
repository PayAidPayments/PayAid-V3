#!/usr/bin/env node
/**
 * Stage 2 Sarvam API smoke (hi/ta/te TTS) — no Docker/Twilio required.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outputPath = path.join(root, 'docs', 'evidence', 'voice-agent', `${stamp}-bolna-stage2-sarvam-api-smoke.md`)

const samples = [
  { language: 'hi', text: 'नमस्ते, यह परीक्षण कॉल है।' },
  { language: 'ta', text: 'வணக்கம், இது சோதனை அழைப்பு.' },
  { language: 'te', text: 'నమస్కారం, ఇది పరీక్ష కాల్.' },
]

async function main() {
  const { sarvamTts, isSarvamConfigured } = await import('../../lib/voice-agent/sarvam.ts')
  const lines = ['# Bolna Stage 2 — Sarvam API smoke', '', `- Timestamp: ${iso}`, '']

  if (!isSarvamConfigured()) {
    lines.push('## Result', '', '- FAIL: SARVAM_API_KEY not set in .env.local / .env')
    writeFileSync(outputPath, `${lines.join('\n')}\n`)
    console.log(JSON.stringify({ ok: false, outputPath }, null, 2))
    process.exit(1)
  }

  const results = []
  for (const { language, text } of samples) {
    let ok = false
    let bytes = 0
    let err = ''
    try {
      const buf = await sarvamTts(text, language, {
        signal: AbortSignal.timeout(30000),
        outputCodec: 'mp3',
      })
      bytes = buf?.length ?? 0
      ok = bytes > 500
    } catch (e) {
      err = e instanceof Error ? e.message : String(e)
    }
    results.push({ language, ok, bytes, err: err || undefined })
    lines.push(`- ${ok ? 'PASS' : 'FAIL'} ${language}: bytes=${bytes}${err ? ` (${err})` : ''}`)
  }

  lines.push('')
  writeFileSync(outputPath, `${lines.join('\n')}\n`)
  const allOk = results.every((r) => r.ok)
  console.log(JSON.stringify({ ok: allOk, outputPath, results }, null, 2))
  process.exit(allOk ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
