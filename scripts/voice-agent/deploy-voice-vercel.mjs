#!/usr/bin/env node
/**
 * Deploy voice app from monorepo root (full tgz) to Vercel project "voice".
 * On Windows paths with spaces, uses `subst` (Vercel CLI chdir bug).
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { resolveVercelToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const token = resolveVercelToken()
if (!token) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'VERCEL_TOKEN or Vercel CLI login required',
        hint: 'VERCEL_OIDC_TOKEN is project-scoped and cannot deploy voice — use a team token or `npx vercel login`',
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const preflight = spawnSync('node', ['scripts/voice-agent/preflight-vercel-auth.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VERCEL_TOKEN: token },
})
if (preflight.status !== 0) {
  process.exit(preflight.status ?? 1)
}

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function patchProject() {
  const patchUrl = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
  patchUrl.searchParams.set('teamId', teamId)
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      rootDirectory: null,
      framework: 'nextjs',
      outputDirectory: 'apps/voice/.next',
      installCommand: 'npm install --legacy-peer-deps --no-audit --no-fund',
      buildCommand:
        'npx prisma generate --schema=packages/db/prisma/schema.prisma && npm run build -w voice',
    }),
  })
  const patchBody = await patchRes.json().catch(() => ({}))
  return { patchOk: patchRes.ok, patchBody }
}

const ensure = spawnSync('node', ['scripts/voice-agent/ensure-voice-vercel-project-settings.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
if (ensure.status !== 0) {
  console.warn('ensure-voice-vercel-project-settings failed; continuing deploy')
}

const patch = await patchProject()
console.log(JSON.stringify({ patch: { patchOk: patch.patchOk, projectId } }, null, 2))

const vercelBin = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vercel.cmd' : 'vercel',
)
const vercelJsRoot = path.join(root, 'node_modules', 'vercel', 'dist', 'vc.js')

const useArchive =
  process.env.VERCEL_DEPLOY_ARCHIVE === '0' || process.env.VERCEL_DEPLOY_ARCHIVE === 'false'
    ? false
    : process.env.VERCEL_DEPLOY_ARCHIVE !== 'files'

const deployArgs = [
  'deploy',
  '--prod',
  '--yes',
  ...(useArchive ? ['--archive=tgz'] : []),
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

function runDeploy(cwd) {
  const vercelJs = existsSync(vercelJsRoot) ? vercelJsRoot : path.join(cwd, 'node_modules', 'vercel', 'dist', 'vc.js')
  const useVercelJs = existsSync(vercelJs)
  const useBin = !useVercelJs && existsSync(vercelBin)
  const cmd = useVercelJs ? process.execPath : useBin ? vercelBin : 'npx'
  const args = useVercelJs ? [vercelJs, ...deployArgs] : useBin ? deployArgs : ['vercel', ...deployArgs]
  console.log(
    JSON.stringify(
      {
        deployCli: useVercelJs
          ? 'node node_modules/vercel/dist/vc.js'
          : useBin
            ? 'node_modules/.bin/vercel'
            : 'npx vercel',
        cwd,
        archive: useArchive ? 'tgz (.vercelignore)' : 'per-file (.vercelignore)',
      },
      null,
      2,
    ),
  )
  const useShell = !useVercelJs && !useBin && process.platform === 'win32'
  return spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: deployEnv,
    shell: useShell,
  })
}

function ensureSubstDrive(rootPath) {
  const preferred = (process.env.VERCEL_DEPLOY_SUBST_DRIVE || 'P:').toUpperCase()
  const letters = [preferred, 'P:', 'Q:', 'R:'].filter((v, i, a) => a.indexOf(v) === i)
  const listing = spawnSync('subst', [], { encoding: 'utf8', shell: false })
  const existing = listing.stdout || ''
  for (const drive of letters) {
    const letter = drive.replace(':', '')
    if (existing.includes(`${letter}:`)) {
      if (existing.toLowerCase().includes(rootPath.toLowerCase())) {
        return { substRoot: `${drive}\\`, drive, reused: true }
      }
      continue
    }
    // shell:false keeps paths with spaces as a single argument (shell:true splits on spaces)
    const created = spawnSync('subst', [`${letter}:`, rootPath], { encoding: 'utf8', shell: false })
    if (created.status === 0) return { substRoot: `${drive}\\`, drive, reused: false }
    console.warn(
      JSON.stringify({ warn: 'subst failed', drive, stderr: created.stderr, stdout: created.stdout }, null, 2),
    )
  }
  return null
}

let result
const useSubst = process.platform === 'win32' && /\s/.test(root)
if (useSubst) {
  const subst = ensureSubstDrive(root)
  if (!subst) {
    console.error(JSON.stringify({ ok: false, error: 'Could not map subst drive for path with spaces' }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ note: 'Using subst for path with spaces', ...subst, root }, null, 2))
  result = runDeploy(subst.substRoot)
  // Windows: `subst /d X:` — not `subst X: /d` (that yields "Invalid parameter").
  if (!subst.reused) {
    const letter = subst.drive.replace(/:$/, '')
    spawnSync('subst', ['/d', `${letter}:`], { encoding: 'utf8', shell: false })
  }
} else {
  result = runDeploy(root)
}

if (result.error) {
  console.error(JSON.stringify({ ok: false, error: result.error.message }, null, 2))
}
process.exit(result.status === 0 ? 0 : result.status ?? 1)
