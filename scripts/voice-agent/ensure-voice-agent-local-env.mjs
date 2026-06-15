#!/usr/bin/env node
/**
 * Copy missing voice-agent keys from .env into .env.local (never prints values).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const envLocalPath = path.join(root, '.env.local')
const KEYS = [
  'SARVAM_API_KEY',
  'JWT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
]

dotenv.config({ path: path.join(root, '.env'), quiet: true })
if (!existsSync(envLocalPath)) {
  console.error(JSON.stringify({ ok: false, error: '.env.local missing' }, null, 2))
  process.exit(1)
}

let text = readFileSync(envLocalPath, 'utf8')
const filled = []
for (const key of KEYS) {
  const value = String(process.env[key] || '').trim()
  if (!value) continue
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(text)) continue
  text = `${text.trimEnd()}\n${key}=${value}\n`
  filled.push(key)
}
writeFileSync(envLocalPath, text.endsWith('\n') ? text : `${text}\n`)
console.log(JSON.stringify({ ok: true, filled, stillMissing: KEYS.filter((k) => !filled.includes(k) && !String(process.env[k] || '').trim()) }, null, 2))
