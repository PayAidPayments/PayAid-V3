#!/usr/bin/env node
/**
 * Push browser live voice public env to the Vercel voice project.
 * Reads NEXT_PUBLIC_* from .env.local. Never prints secret values.
 *
 * Usage:
 *   node scripts/voice-agent/push-browser-live-vercel-env.mjs [--dry-run]
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VOICE_BROWSER_LIVE_VERCEL_PUBLIC,
  VOICE_VERCEL_REDEPLOY_NOTE,
} from './lib/vercel-voice-env-contract.mjs'
import { resolveVercelVoiceContext, upsertPlainEnv } from './lib/vercel-voice-env-api.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const dryRun = process.argv.includes('--dry-run')
const { token, teamId, projectId } = resolveVercelVoiceContext()

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN required' }, null, 2))
  process.exit(1)
}

const results = []
for (const spec of VOICE_BROWSER_LIVE_VERCEL_PUBLIC) {
  const fromEnv = String(process.env[spec.key] || '').trim()
  const value = fromEnv || spec.defaultValue || ''
  if (!value && spec.required) {
    results.push({ key: spec.key, ok: false, skipped: true, reason: 'missing locally' })
    continue
  }
  if (!value) {
    results.push({ key: spec.key, ok: true, skipped: true, reason: 'optional and unset' })
    continue
  }
  results.push(
    await upsertPlainEnv({ token, teamId, projectId, key: spec.key, value, dryRun }),
  )
}

const pushed = results.filter((r) => r.ok && !r.skipped && !r.dryRun)

console.log(
  JSON.stringify(
    {
      ok: results.every((r) => r.ok || r.skipped),
      dryRun,
      projectId,
      results,
      redeployRequired: pushed.length > 0 && !dryRun,
      redeployNote: VOICE_VERCEL_REDEPLOY_NOTE,
      next: pushed.length && !dryRun ? ['npm run deploy:voice:git-archive'] : [],
      sidecarNote:
        'Deploy WSS sidecar (deployment/browser-live-ws) and set NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://… before investor demo.',
    },
    null,
    2,
  ),
)

process.exit(results.every((r) => r.ok || r.skipped) ? 0 : 1)
