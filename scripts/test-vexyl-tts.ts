/**
 * Test VEXYL TTS connectivity and auth.
 * Uses .env: VEXYL_TTS_URL, VEXYL_API_KEY, VEXYL_AUTH_HEADER
 *
 * Run: npx tsx scripts/test-vexyl-tts.ts
 * Success: writes test-vexyl-out.wav and prints "OK (200)".
 * 401: try VEXYL_AUTH_HEADER=X-API-Key or none (and restart).
 */

import 'dotenv/config'
import { writeFileSync } from 'fs'
import { synthesizeWithVexyl } from '../lib/voice-agent/vexyl-tts'

const url = (process.env.VEXYL_TTS_URL || 'http://localhost:8080').replace(/\/$/, '')
const path = process.env.VEXYL_TTS_PATH || '/tts'
const hasKey = !!process.env.VEXYL_API_KEY?.trim() && process.env.VEXYL_API_KEY?.toLowerCase() !== 'undefined'
const authHeader = (process.env.VEXYL_AUTH_HEADER || 'Bearer').trim() || '(none)'

console.log('VEXYL_TTS_URL:', url)
console.log('VEXYL_TTS_PATH:', path)
console.log('VEXYL_API_KEY:', hasKey ? '(set)' : '(not set)')
console.log('VEXYL_AUTH_HEADER:', authHeader)
console.log('Request:', `${url}${path.startsWith('/') ? path : '/' + path}`)
console.log('')

synthesizeWithVexyl('Hello', {
  language: 'en',
  speaker: 'divya-calm',
})
  .then((buffer) => {
    const outPath = 'test-vexyl-out.wav'
    writeFileSync(outPath, buffer)
    console.log('OK (200). Wrote', outPath)
  })
  .catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Request failed:', msg)
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      console.error('\nVEXYL server not reachable at', url + path)
      console.error('  • VEXYL is a separate service: run it (e.g. Docker or its own repo) or leave it unset.')
      console.error('  • If unset/unreachable, PayAid uses other TTS (Bhashini/Coqui) and demo still works (text or fallback voice).')
      console.error('  • To use VEXYL: set VEXYL_TTS_URL to where the server runs and ensure it is started.')
    } else if (msg.includes('401')) {
      console.error('\n401 fix: Set VEXYL_API_KEY to your server key and try:')
      console.error('  VEXYL_AUTH_HEADER=X-API-Key   (or Api-Key, or none for no auth)')
      console.error('Then restart: npm run dev')
    }
    process.exit(1)
  })
