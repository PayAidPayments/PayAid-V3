#!/usr/bin/env node
/**
 * Fill missing deployment/bolna/.env keys from .env.local / .env (never overwrites non-empty).
 * Never prints secret values.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const targetPath = path.join(root, 'deployment/bolna/.env')

dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const SYNC_KEYS = [
  'PAYAID_BRIDGE_BASE_URL',
  'BOLNA_BRIDGE_SECRET',
  'SARVAM_API_KEY',
  'SARVAM_TTS_API_KEY',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DEEPGRAM_AUTH_TOKEN',
  'ELEVENLABS_API_KEY',
  'CARTESIA_API_KEY',
  'SMALLEST_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
]

function parseMap(text) {
  const map = new Map()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^"|"$/g, ''))
  }
  return map
}

function serialize(map) {
  const lines = ['# Synced by npm run voice-agent:sync-bolna-sidecar-env-from-app (fills missing keys only)', '']
  for (const [key, value] of map.entries()) lines.push(`${key}=${value}`)
  return `${lines.join('\n')}\n`
}

const existing = existsSync(targetPath) ? parseMap(readFileSync(targetPath, 'utf8')) : new Map()
const filled = []
const skipped = []

for (const key of SYNC_KEYS) {
  const fromApp = String(process.env[key] || '').trim()
  const current = String(existing.get(key) || '').trim()
  if (current) {
    skipped.push(key)
    continue
  }
  if (!fromApp) continue
  existing.set(key, fromApp)
  filled.push(key)
}

if (!String(existing.get('SARVAM_TTS_API_KEY') || '').trim() && String(existing.get('SARVAM_API_KEY') || '').trim()) {
  if (!skipped.includes('SARVAM_TTS_API_KEY')) {
    existing.set('SARVAM_TTS_API_KEY', existing.get('SARVAM_API_KEY'))
    filled.push('SARVAM_TTS_API_KEY(from SARVAM_API_KEY)')
  }
}

if (!String(existing.get('PAYAID_BRIDGE_BASE_URL') || '').trim()) {
  const base = String(process.env.BASE_URL || process.env.PAYAID_BRIDGE_BASE_URL || '').trim()
  if (base) {
    existing.set('PAYAID_BRIDGE_BASE_URL', base)
    filled.push('PAYAID_BRIDGE_BASE_URL')
  }
}

writeFileSync(targetPath, serialize(existing))

console.log(
  JSON.stringify(
    {
      ok: true,
      targetPath,
      filled,
      skippedExisting: skipped.length,
      missingAfterSync: SYNC_KEYS.filter((k) => !String(existing.get(k) || '').trim()),
    },
    null,
    2,
  ),
)
