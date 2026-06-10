#!/usr/bin/env node
/**
 * Push Stage 1 production voice secrets to the Vercel voice project.
 * Reads BOLNA_BRIDGE_SECRET, DATABASE_URL, JWT_SECRET from .env.local then .env.
 * Never prints secret values. After push, a redeploy is required (see contract note).
 *
 * Usage:
 *   node scripts/voice-agent/push-stage1-vercel-secrets.mjs [--dry-run]
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VOICE_VERCEL_PUSH_SECRETS,
  VOICE_VERCEL_REDEPLOY_NOTE,
} from './lib/vercel-voice-env-contract.mjs'
import { resolveVercelVoiceContext, upsertEncryptedEnv } from './lib/vercel-voice-env-api.mjs'

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
for (const spec of VOICE_VERCEL_PUSH_SECRETS) {
  const value = String(process.env[spec.key] || '').trim()
  if (!value) {
    results.push({ key: spec.key, ok: false, skipped: true, reason: 'missing locally' })
    continue
  }
  if (spec.minLength && value.length < spec.minLength) {
    results.push({
      key: spec.key,
      ok: false,
      skipped: true,
      reason: `length ${value.length} < ${spec.minLength}`,
    })
    continue
  }
  results.push(
    await upsertEncryptedEnv({ token, teamId, projectId, key: spec.key, value, dryRun }),
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
    },
    null,
    2,
  ),
)

process.exit(results.every((r) => r.ok || r.skipped) ? 0 : 1)
