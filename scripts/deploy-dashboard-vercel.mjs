#!/usr/bin/env node
/**
 * Deploy dashboard from a short temp path with git archive + live overlay.
 * Avoids multi-hour tgz walks from "Cursor Projects" on Windows.
 */
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { resolveVercelToken } from './voice-agent/read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workDir =
  process.env.VERCEL_DASHBOARD_DEPLOY_WORKDIR ||
  (process.platform === 'win32' ? 'D:\\Temp\\payaid-dashboard-deploy' : path.join(os.tmpdir(), 'payaid-dashboard-deploy'))

const token = resolveVercelToken()

async function tokenIsValid(candidate) {
  if (!candidate) return false
  const res = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${candidate}` },
  })
  return res.ok
}

const tokenOk = await tokenIsValid(token)
if (!tokenOk && !token) {
  console.error(JSON.stringify({ ok: false, error: 'Vercel token required (npx vercel login)' }, null, 2))
  process.exit(1)
}
if (!tokenOk) {
  console.warn(JSON.stringify({ warning: 'VERCEL_TOKEN invalid; using CLI auth.json session' }, null, 2))
}

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  '.next-vercel-build',
  '.next-triage-route-collapse-api-600s',
  '.turbo',
  'coverage',
  'playwright-report',
  'test-results',
])

const ROBOCOPY_EXIT_OK = new Set([0, 1, 2, 3, 4, 5, 6, 7])

function listSkipDirNames(src) {
  const extras = new Set(SKIP_DIR_NAMES)
  if (!existsSync(src)) return [...extras]
  for (const name of readdirSync(src)) {
    if (name.startsWith('.next')) extras.add(name)
  }
  return [...extras]
}

function copyWithRobocopy(src, dest) {
  mkdirSync(path.dirname(dest), { recursive: true })
  const xd = listSkipDirNames(src)
  console.log(JSON.stringify({ step: 'robocopy', src, dest, excludeDirs: xd.length }, null, 2))
  const args = [src, dest, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/nc', '/ns', '/np', '/XD', ...xd]
  const result = spawnSync('robocopy', args, { stdio: 'inherit', shell: false })
  const code = result.status ?? 1
  if (!ROBOCOPY_EXIT_OK.has(code)) {
    console.error(JSON.stringify({ ok: false, error: 'robocopy failed', src, dest, code }, null, 2))
    process.exit(code)
  }
}

function copyTreeFiltered(src, dest) {
  const st = statSync(src)
  if (st.isDirectory()) {
    const base = path.basename(src)
    if (SKIP_DIR_NAMES.has(base) || base.startsWith('.next')) return
    mkdirSync(dest, { recursive: true })
    for (const name of readdirSync(src)) {
      copyTreeFiltered(path.join(src, name), path.join(dest, name))
    }
    return
  }
  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(src, dest)
}

function replaceTreeFiltered(src, dest) {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
  copyTreeFiltered(src, dest)
}
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_DASHBOARD_PROJECT_ID || 'prj_bJ5BclTw72V6QFlsmGtR6BLTqqdx'
const vercelJs = path.join(root, 'node_modules', 'vercel', 'dist', 'vc.js')

if (!existsSync(vercelJs)) {
  console.error(JSON.stringify({ ok: false, error: 'Run npm install at repo root first' }, null, 2))
  process.exit(1)
}

/** Minimal monorepo tree for dashboard Vercel build (@/* resolves to repo root). */
const DEPLOY_PATHS = [
  'package.json',
  'package-lock.json',
  'scripts',
  'prisma',
  'contexts',
  'apps/dashboard',
  'packages',
  'modules',
  'lib',
  'types',
  'components',
  'server',
  'constants',
  'config',
  'middleware',
  'messages',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'public/logo.png',
  'public/hero-spline-poster.webp',
  'public/hero-spline-poster.jpg',
]

const deployRef = process.env.DASHBOARD_DEPLOY_GIT_REF || 'HEAD'

if (existsSync(workDir) && process.env.DASHBOARD_DEPLOY_SKIP_RM !== '1') {
  rmSync(workDir, { recursive: true, force: true })
}
mkdirSync(workDir, { recursive: true })

console.log(JSON.stringify({ step: 'git-archive', workDir, ref: deployRef, paths: DEPLOY_PATHS.length }, null, 2))

const tarPath = path.join(workDir, '.deploy-archive.tar')
const archive = spawnSync(
  'git',
  ['archive', '--format=tar', `--output=${tarPath}`, deployRef, '--', ...DEPLOY_PATHS],
  { cwd: root, stdio: 'inherit' }
)
if (archive.status !== 0) {
  console.error(JSON.stringify({ ok: false, error: 'git archive failed', ref: deployRef }, null, 2))
  process.exit(archive.status ?? 1)
}

const extract = spawnSync('tar', ['-xf', tarPath, '-C', workDir], { cwd: root, stdio: 'inherit', shell: true })
if (extract.status !== 0) {
  console.error(JSON.stringify({ ok: false, error: 'tar extract failed' }, null, 2))
  process.exit(extract.status ?? 1)
}
rmSync(tarPath, { force: true })

for (const rel of DEPLOY_PATHS) {
  console.log(JSON.stringify({ step: 'archived', rel }, null, 2))
}

// Overlay local deploy/build scripts so uncommitted packaging fixes ship immediately.
const overlayFiles = [
  'apps/dashboard/scripts/vercel-build.cjs',
  'apps/dashboard/vercel.json',
  'apps/dashboard/next.config.mjs',
]
for (const rel of overlayFiles) {
  const src = path.join(root, rel)
  const dest = path.join(workDir, rel)
  if (!existsSync(src)) continue
  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  console.log(JSON.stringify({ step: 'overlay', rel }, null, 2))
}

for (const name of ['.vercelignore']) {
  const src = path.join(root, name)
  if (existsSync(src)) copyFileSync(src, path.join(workDir, name))
}

const dashVercel = path.join(root, 'apps', 'dashboard', '.vercel', 'project.json')
const dashAppDir = path.join(workDir, 'apps', 'dashboard')
if (existsSync(dashVercel)) {
  mkdirSync(path.join(workDir, '.vercel'), { recursive: true })
  copyFileSync(dashVercel, path.join(workDir, '.vercel', 'project.json'))
}

// Vercel framework=nextjs expects app/, public/, and next.config at the upload root.
// Physically copy dashboard routes/assets to the monorepo root in the deploy bundle.
const dashApp = path.join(dashAppDir, 'app')
const dashPublic = path.join(dashAppDir, 'public')
const rootApp = path.join(workDir, 'app')
const rootPublic = path.join(workDir, 'public')
const dashMiddleware = path.join(dashAppDir, 'middleware.ts')
const rootMiddleware = path.join(workDir, 'middleware.ts')

replaceTreeFiltered(dashApp, rootApp)
console.log(JSON.stringify({ step: 'copied', from: 'apps/dashboard/app', to: 'app' }, null, 2))

// Moving apps/dashboard/app to root/app changes the depth of legacy relative
// imports that intentionally climbed five levels back to the monorepo root.
// Rewrite only those known root-component imports in the deploy copy.
const rootComponentImportFiles = [
  'dashboard/decisions/page.tsx',
  'dashboard/deals/page.tsx',
  'dashboard/contacts/page.tsx',
  'dashboard/compliance/page.tsx',
  'dashboard/collaboration/page.tsx',
]
for (const rel of rootComponentImportFiles) {
  const file = path.join(rootApp, rel)
  if (!existsSync(file)) continue
  const source = readFileSync(file, 'utf8')
  const rewritten = source.replace(
    /(['"])\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\//g,
    '$1@/components/'
  )
  writeFileSync(file, rewritten)
  console.log(JSON.stringify({ step: 'rewrote-root-imports', rel: `app/${rel}` }, null, 2))
}

mkdirSync(rootPublic, { recursive: true })
if (existsSync(dashPublic)) {
  copyTreeFiltered(dashPublic, rootPublic)
  console.log(JSON.stringify({ step: 'merged', from: 'apps/dashboard/public', to: 'public' }, null, 2))
}

if (existsSync(dashMiddleware)) {
  copyFileSync(dashMiddleware, rootMiddleware)
  console.log(JSON.stringify({ step: 'copied', from: 'apps/dashboard/middleware.ts', to: 'middleware.ts' }, null, 2))
}

writeFileSync(
  path.join(workDir, 'next.config.mjs'),
  "export { default } from './apps/dashboard/next.config.mjs'\n"
)
console.log(JSON.stringify({ step: 'wrote', file: 'next.config.mjs' }, null, 2))

// Deploy from monorepo root with framework=nextjs. Build runs at this root so `.next`
// is created in-place (mirroring apps/dashboard/.next broke Vercel packaging).
writeFileSync(
  path.join(workDir, 'vercel.json'),
  `${JSON.stringify(
    {
      installCommand: 'npm install --legacy-peer-deps --no-audit --no-fund',
      buildCommand: 'node apps/dashboard/scripts/vercel-build.cjs',
      framework: 'nextjs',
    },
    null,
    2
  )}\n`
)

const voiceDemoPage = path.join(dashAppDir, 'app', 'voice-agents', '[tenantId]', 'Demo', 'page.tsx')
if (!existsSync(voiceDemoPage)) {
  console.error(JSON.stringify({ ok: false, error: 'Voice demo page missing in deploy bundle', voiceDemoPage }, null, 2))
  process.exit(1)
}

const deployArgs = ['deploy', '--prod', '--yes', '--archive=tgz']
console.log(JSON.stringify({ step: 'vercel-deploy', cwd: workDir, tokenMode: tokenOk ? 'env' : 'cli-auth' }, null, 2))

const deployEnv = {
  ...process.env,
  VERCEL_ORG_ID: teamId,
  VERCEL_PROJECT_ID: projectId,
}
if (tokenOk) deployEnv.VERCEL_TOKEN = token
else delete deployEnv.VERCEL_TOKEN

const deploy = spawnSync(process.execPath, [vercelJs, ...deployArgs], {
  cwd: workDir,
  stdio: 'inherit',
  env: deployEnv,
})

process.exit(deploy.status === 0 ? 0 : deploy.status ?? 1)
