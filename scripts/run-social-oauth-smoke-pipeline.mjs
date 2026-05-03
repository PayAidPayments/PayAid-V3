#!/usr/bin/env node
/**
 * One-command social OAuth smoke pipeline.
 *
 * Behavior:
 * - uses SOCIAL_SMOKE_AUTH_TOKEN if already present
 * - otherwise attempts token bootstrap when SOCIAL_SMOKE_LOGIN_EMAIL/PASSWORD are set
 * - runs scripts/smoke-social-oauth-connectors.mjs
 */

import { spawnSync } from 'node:child_process'

const env = { ...process.env }

if (!env.SOCIAL_SMOKE_BASE_URL) {
  env.SOCIAL_SMOKE_BASE_URL = 'http://127.0.0.1:3000'
}

function runNodeScript(args) {
  return spawnSync(process.execPath, args, {
    env,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

if (!env.SOCIAL_SMOKE_AUTH_TOKEN && env.SOCIAL_SMOKE_LOGIN_EMAIL && env.SOCIAL_SMOKE_LOGIN_PASSWORD) {
  const tokenProbe = runNodeScript(['scripts/get-social-oauth-smoke-token.mjs', '--json'])
  if (tokenProbe.status !== 0) {
    process.stdout.write(tokenProbe.stdout || '')
    process.stderr.write(tokenProbe.stderr || '')
    process.exit(tokenProbe.status ?? 1)
  }
  const parsed = JSON.parse(tokenProbe.stdout || '{}')
  if (!parsed?.ok || !parsed?.token) {
    console.error(JSON.stringify({ ok: false, error: 'Token helper did not return token', parsed }, null, 2))
    process.exit(1)
  }
  env.SOCIAL_SMOKE_AUTH_TOKEN = parsed.token
}

const smoke = spawnSync(process.execPath, ['scripts/smoke-social-oauth-connectors.mjs'], {
  env,
  encoding: 'utf8',
  stdio: 'pipe',
})

process.stdout.write(smoke.stdout || '')
process.stderr.write(smoke.stderr || '')
process.exit(smoke.status ?? 1)

