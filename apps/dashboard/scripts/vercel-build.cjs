/**
 * Vercel build entrypoint for monorepo-root Next.js deploys.
 *
 * The deploy bundle copies apps/dashboard/{app,public,middleware} to the upload
 * root and writes a root next.config.mjs. Build must run at that root so `.next`
 * is created in-place — mirroring apps/dashboard/.next broke Vercel packaging
 * (ENOENT /node_modules/client-only).
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function setDefault(name, value) {
  if (process.env[name] === undefined || process.env[name] === '') {
    process.env[name] = value
  }
}

setDefault('NEXT_BUILD_DIST_DIR', '.next')
setDefault('NEXT_BUILD_TIMEOUT_MS', '0')
setDefault('NEXT_BUILD_KILL_GRACE_MS', '15000')
setDefault('NEXT_BUILD_HEARTBEAT_MS', '60000')
setDefault('NEXT_BUILD_PREFERRED_MODE', 'turbopack')
setDefault('NEXT_BUILD_ALLOW_ALTERNATE_RETRY', '0')
setDefault('NEXT_BUILD_CLEAR_STALE_LOCK', '1')
setDefault('NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING', '1')
setDefault('VERCEL_ALLOW_WEBPACK_FALLBACK', '0')
setDefault('NODE_OPTIONS', '--max-old-space-size=3584')


const appRoot = path.resolve(__dirname, '..')
const monorepoRoot = path.resolve(appRoot, '../..')

const rootApp = path.join(monorepoRoot, 'app')
const rootConfig = path.join(monorepoRoot, 'next.config.mjs')
if (!fs.existsSync(rootApp)) {
  console.error(`[vercel-build] missing root app/ at ${rootApp} — deploy bundle must copy apps/dashboard/app`)
  process.exit(1)
}
if (!fs.existsSync(rootConfig)) {
  console.error(`[vercel-build] missing root next.config.mjs at ${rootConfig}`)
  process.exit(1)
}

const preferred = String(process.env.NEXT_BUILD_PREFERRED_MODE || 'turbopack').toLowerCase()
const modeFlag = preferred === 'webpack' ? '--webpack' : '--turbopack'
const nextBin = require.resolve('next/dist/bin/next', { paths: [monorepoRoot, appRoot] })

console.log(`[vercel-build] building at monorepo root: next build ${modeFlag}`)
const result = spawnSync(process.execPath, [nextBin, 'build', modeFlag], {
  stdio: 'inherit',
  cwd: monorepoRoot,
  env: process.env,
})

if ((result.status ?? 1) !== 0) {
  console.error(`[vercel-build] next build failed with status ${result.status}`)
  process.exit(result.status ?? 1)
}

const rootNext = path.join(monorepoRoot, process.env.NEXT_BUILD_DIST_DIR || '.next')
if (!fs.existsSync(rootNext)) {
  console.error(`[vercel-build] missing build output: ${rootNext}`)
  process.exit(1)
}

console.log(`[vercel-build] ok: ${rootNext}`)
process.exit(0)
