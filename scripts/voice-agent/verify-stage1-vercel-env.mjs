#!/usr/bin/env node
/**
 * Verify Vercel voice project env key names match Stage 1 runtime contract (presence only).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VOICE_VERCEL_PUSH_SECRETS,
  VOICE_VERCEL_PULL_LOCAL,
} from './lib/vercel-voice-env-contract.mjs'
import { resolveVercelVoiceContext, listProjectEnvs, envPresenceReport } from './lib/vercel-voice-env-api.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const { token, teamId, projectId } = resolveVercelVoiceContext()
if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN required' }, null, 2))
  process.exit(1)
}

const envs = await listProjectEnvs({ token, teamId, projectId })
const secrets = envPresenceReport(envs, VOICE_VERCEL_PUSH_SECRETS)
const localKeys = VOICE_VERCEL_PULL_LOCAL.map((s) => s.key)

const localPresent = VOICE_VERCEL_PUSH_SECRETS.map((spec) => {
  const v = String(process.env[spec.key] || '').trim()
  return {
    key: spec.key,
    localSet: Boolean(v),
    localLen: v ? v.length : 0,
    localMeetsMin: spec.minLength ? v.length >= spec.minLength : Boolean(v),
  }
})

const ok =
  secrets.every((s) => s.present && s.production) &&
  localPresent.filter((s) => VOICE_VERCEL_PUSH_SECRETS.find((x) => x.key === s.key)?.required).every(
    (s) => s.localMeetsMin,
  )

console.log(
  JSON.stringify(
    {
      ok,
      projectId,
      vercelSecretKeys: secrets,
      localSecretKeys: localPresent,
      pullLocalKeys: localKeys,
      contractReaders: VOICE_VERCEL_PUSH_SECRETS.map((s) => ({ key: s.key, readers: s.readers })),
    },
    null,
    2,
  ),
)

process.exit(ok ? 0 : 1)
