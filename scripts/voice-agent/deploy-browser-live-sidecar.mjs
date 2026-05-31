#!/usr/bin/env node
/**
 * Deploy browser-live WSS sidecar to Fly.io (M1).
 *
 * Prereqs:
 *   flyctl auth login   (once)
 *   fly apps create payaid-browser-live-ws   (once, or set FLY_BROWSER_LIVE_APP)
 *
 * Reads DATABASE_URL, JWT_SECRET, GROQ_API_KEY from .env.local (never printed).
 *
 * Usage:
 *   node scripts/voice-agent/deploy-browser-live-sidecar.mjs [--dry-run]
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const dryRun = process.argv.includes('--dry-run')
const appName = process.env.FLY_BROWSER_LIVE_APP || 'payaid-browser-live-ws'
const flyToml = path.join(root, 'deployment/browser-live-ws/fly.toml')

function resolveFlyctl() {
  const candidates = [
    process.env.FLYCTL_BIN,
    path.join(os.homedir(), '.fly', 'bin', 'flyctl.exe'),
    path.join(os.homedir(), '.fly', 'bin', 'flyctl'),
    'flyctl',
    'fly',
  ].filter(Boolean)
  for (const bin of candidates) {
    if (bin.includes(path.sep) || bin.includes('/')) {
      if (existsSync(bin)) return bin
    } else {
      return bin
    }
  }
  return 'flyctl'
}

function runFly(args, { inherit = false } = {}) {
  const flyctl = resolveFlyctl()
  const result = spawnSync(flyctl, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
    env: process.env,
  })
  return { flyctl, ...result }
}

const whoami = runFly(['auth', 'whoami'])
if (whoami.status !== 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Fly not authenticated',
        fix: `${whoami.flyctl} auth login`,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const secrets = ['DATABASE_URL', 'JWT_SECRET', 'GROQ_API_KEY'].map((key) => ({
  key,
  value: String(process.env[key] || '').trim(),
}))

const missing = secrets.filter((s) => !s.value).map((s) => s.key)
if (missing.length) {
  console.error(JSON.stringify({ ok: false, error: 'Missing local secrets', missing }, null, 2))
  process.exit(1)
}

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: true,
        appName,
        flyToml,
        whoami: (whoami.stdout || '').trim(),
        secrets: secrets.map((s) => s.key),
        deploy: `${whoami.flyctl} deploy --config deployment/browser-live-ws/fly.toml --app ${appName}`,
        wsUrl: `wss://${appName}.fly.dev`,
        next: [
          'Set NEXT_PUBLIC_VOICE_LIVE_WS_URL in .env.local',
          'npm run voice-agent:push-browser-live-vercel-env',
          'npm run deploy:voice:git-archive',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const apps = runFly(['apps', 'list', '--json'])
let appExists = false
if (apps.status === 0) {
  try {
    const list = JSON.parse(apps.stdout || '[]')
    appExists = list.some((a) => a.Name === appName || a.name === appName)
  } catch {
    appExists = (apps.stdout || '').includes(appName)
  }
}

if (!appExists) {
  console.log(JSON.stringify({ step: 'fly-apps-create', appName }, null, 2))
  const create = runFly(['apps', 'create', appName, '--org', process.env.FLY_ORG || 'personal'], {
    inherit: true,
  })
  if (create.status !== 0) process.exit(create.status ?? 1)
}

console.log(JSON.stringify({ step: 'fly-secrets-set', appName, keys: secrets.map((s) => s.key) }, null, 2))
for (const { key, value } of secrets) {
  const set = runFly(['secrets', 'set', `${key}=${value}`, '--app', appName], { inherit: true })
  if (set.status !== 0) process.exit(set.status ?? 1)
}

console.log(JSON.stringify({ step: 'fly-deploy', appName, config: 'deployment/browser-live-ws/fly.toml' }, null, 2))
const deploy = runFly(['deploy', '--config', flyToml, '--app', appName], { inherit: true })
if (deploy.status !== 0) process.exit(deploy.status ?? 1)

const wsUrl = `wss://${appName}.fly.dev`
console.log(
  JSON.stringify(
    {
      ok: true,
      appName,
      wsUrl,
      health: `https://${appName}.fly.dev/health`,
      next: [
        `Add to .env.local: NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl}`,
        'npm run voice-agent:push-browser-live-vercel-env',
        'npm run deploy:voice:git-archive',
        `npm run voice-agent:smoke-browser-live-wss -- --token=<jwt> (set NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl})`,
      ],
    },
    null,
    2,
  ),
)
