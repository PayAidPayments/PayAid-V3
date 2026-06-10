#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3003'
const env = {
  ...process.env,
  BASE_URL: baseUrl,
  PAYAID_BRIDGE_BASE_URL: baseUrl,
  VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS: process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '180000',
}

console.log('Running smoke against', baseUrl)
const r = spawnSync('node', ['scripts/voice-agent/bolna-bridge-stage1-smoke.mjs'], {
  cwd: root,
  env,
  stdio: 'inherit',
})
process.exit(r.status ?? 1)
