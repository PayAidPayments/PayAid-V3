#!/usr/bin/env node
/**
 * Summarize browser-live latency JSON exported from the Live Demo UI.
 * Usage: node scripts/voice-agent/summarize-browser-live-latency.mjs path/to/export.json
 */
import fs from 'node:fs'

const path = process.argv[2]
if (!path) {
  console.error('Usage: node scripts/voice-agent/summarize-browser-live-latency.mjs <export.json>')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(path, 'utf8'))
const events = data.events || []

function pairs(turnId) {
  const t = events.filter((e) => e.turnId === turnId)
  const stopped = t.find((e) => e.event === 'speech_stopped')?.at
  const audio = t.find((e) => e.event === 'audio_first_byte')?.at
  if (stopped && audio) return audio - stopped
  return null
}

const turnIds = [...new Set(events.map((e) => e.turnId).filter(Boolean))]
const e2e = turnIds.map(pairs).filter((n) => n != null)
const interrupts = events.filter((e) => e.event === 'interrupt_silence')

const summary = {
  file: path,
  recordedAt: data.recordedAt,
  turnCount: turnIds.length,
  e2eSpeechToAudioMs: e2e.length
    ? { min: Math.min(...e2e), max: Math.max(...e2e), avg: Math.round(e2e.reduce((a, b) => a + b, 0) / e2e.length) }
    : null,
  interruptSamples: interrupts.length,
  passE2eUnder1500: e2e.every((n) => n <= 1500),
  passInterruptUnder150: interrupts.every((e) => (e.meta?.msToSilence ?? 999) <= 150),
}

console.log(JSON.stringify(summary, null, 2))
