#!/usr/bin/env node
/**
 * Local validation: health → smoke → evidence (sidecar must already be listening).
 *
 * Terminal A:
 *   npm run dev:browser-live-ws:offline
 *
 * Terminal B (after sidecar prints ok JSON, ~1–6 min cold start on Windows):
 *   npm run voice-agent:validate-browser-live-local
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const healthUrl =
  process.env.BROWSER_LIVE_HEALTH_URL ||
  `http://127.0.0.1:${process.env.VOICE_LIVE_WS_PORT || '3002'}/health`

function run(label, cmd, args) {
  console.error(JSON.stringify({ step: label }))
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (res.status !== 0) {
    console.error(JSON.stringify({ ok: false, failed: label, status: res.status ?? 1 }))
    process.exit(res.status ?? 1)
  }
}

try {
  const res = await fetch(healthUrl, { signal: AbortSignal.timeout(8000) })
  const body = await res.json()
  console.error(JSON.stringify({ step: 'health', body }))
  if (!body.ok) {
    console.error(JSON.stringify({ ok: false, error: 'Sidecar health not ok' }))
    process.exit(1)
  }
  if (body.stubMode && !body.offlineReal) {
    console.error(
      JSON.stringify({
        ok: false,
        error:
          'Sidecar is stub-only. Start with: npm run dev:browser-live-ws:offline (or unset BROWSER_LIVE_STUB)',
      }),
    )
    process.exit(1)
  }
} catch (e) {
  console.error(
    JSON.stringify({
      ok: false,
      error: `Sidecar not reachable at ${healthUrl}. Start: npm run dev:browser-live-ws:offline`,
      detail: e instanceof Error ? e.message : String(e),
    }),
  )
  process.exit(1)
}

if (!process.env.SMOKE_AUTH_TOKEN?.trim()) {
  const mint = spawnSync('node', ['scripts/voice-agent/mint-stage1-validation-auth-token.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  const line = (mint.stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.startsWith('eyJ'))
  if (line) process.env.SMOKE_AUTH_TOKEN = line
  else if (mint.status !== 0) {
    console.error(JSON.stringify({ ok: false, error: 'Failed to mint SMOKE_AUTH_TOKEN', stderr: mint.stderr }))
    process.exit(1)
  }
}

run('smoke', 'node', ['scripts/voice-agent/smoke-browser-live-wss.mjs'])
run('evidence', 'node', ['scripts/voice-agent/browser-live-real-mode-evidence.mjs'])
console.log(JSON.stringify({ ok: true }))
