#!/usr/bin/env node
/**
 * Wire browser-live WSS URL into Vercel voice project and optionally redeploy.
 *
 * Usage:
 *   NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://payaid-browser-live-ws.onrender.com \
 *     node scripts/voice-agent/wire-browser-live-production.mjs [--deploy]
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const deploy = process.argv.includes('--deploy')
const wsUrl = String(process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || '').trim()

if (!wsUrl) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'NEXT_PUBLIC_VOICE_LIVE_WS_URL required (wss://…)',
        examples: [
          'wss://payaid-browser-live-ws.onrender.com',
          'wss://payaid-browser-live-ws.fly.dev',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

if (/^(wss?:\/\/)?(localhost|127\.0\.0\.1)/i.test(wsUrl)) {
  console.error(JSON.stringify({ ok: false, error: 'Use public wss:// URL, not localhost' }, null, 2))
  process.exit(1)
}

const push = spawnSync('node', ['scripts/voice-agent/push-browser-live-vercel-env.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
if (push.status !== 0) process.exit(push.status ?? 1)

if (deploy) {
  const voice = spawnSync('npm', ['run', 'deploy:voice:git-archive'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (voice.status !== 0) process.exit(voice.status ?? 1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      wsUrl,
      vercelEnvPushed: true,
      voiceRedeployed: deploy,
      liveDemo:
        'https://voice-six-xi.vercel.app/voice-agents/{tenantId}/LiveDemo?agentId=va_stage1_bolna_smoke',
      smoke: `NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl} npm run voice-agent:smoke-browser-live-wss`,
    },
    null,
    2,
  ),
)
