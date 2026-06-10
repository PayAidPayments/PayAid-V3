#!/usr/bin/env node
/**
 * Deploy voice from a git-archive extract in a short temp path (no .git, no spaces).
 * Avoids multi-GB tgz walks and Windows path issues on "Cursor Projects".
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { resolveVercelToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const token = resolveVercelToken()
if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'Vercel token required' }, null, 2))
  process.exit(1)
}

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const vercelJs = path.join(root, 'node_modules', 'vercel', 'dist', 'vc.js')
if (!existsSync(vercelJs)) {
  console.error(JSON.stringify({ ok: false, error: 'Run npm install vercel@41.4.0 at repo root first' }, null, 2))
  process.exit(1)
}

const preflight = spawnSync('node', ['scripts/voice-agent/preflight-vercel-auth.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VERCEL_TOKEN: token },
})
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const buildOnly = process.env.VOICE_DEPLOY_ARCHIVE_ONLY === '1'
const skipArchive = process.env.VOICE_DEPLOY_SKIP_ARCHIVE === '1'
const workDir =
  process.env.VERCEL_VOICE_DEPLOY_WORKDIR ||
  (process.platform === 'win32' ? 'D:\\Temp\\payaid-voice-deploy' : path.join(os.tmpdir(), 'payaid-voice-deploy'))

if (!skipArchive) {
  const buildArchive = spawnSync('node', ['scripts/voice-agent/build-voice-deploy-archive.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VERCEL_VOICE_DEPLOY_WORKDIR: workDir },
  })
  if (buildArchive.status !== 0) process.exit(buildArchive.status ?? 1)
}
if (buildOnly) process.exit(0)

if (!existsSync(path.join(workDir, 'package.json'))) {
  console.error(
    JSON.stringify(
      { ok: false, error: 'Deploy workdir missing package.json', workDir, hint: 'Run voice-agent:build-deploy-archive first' },
      null,
      2,
    ),
  )
  process.exit(1)
}

const deployArgs = [
  'deploy',
  '--prod',
  '--yes',
  '--archive=tgz',
  '--local-config',
  'vercel-voice.json',
  '--token',
  token,
]

const deployEnv = {
  ...process.env,
  VERCEL_TOKEN: token,
  VERCEL_ORG_ID: teamId,
  VERCEL_PROJECT_ID: projectId,
}

console.log(JSON.stringify({ step: 'vercel-deploy', cwd: workDir, cli: 'node vercel/dist/vc.js' }, null, 2))
const deploy = spawnSync(process.execPath, [vercelJs, ...deployArgs], {
  cwd: workDir,
  stdio: 'inherit',
  env: deployEnv,
  shell: false,
})

process.exit(deploy.status === 0 ? 0 : deploy.status ?? 1)
