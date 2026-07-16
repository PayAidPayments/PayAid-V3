/**
 * Vercel build entrypoint: keeps `vercel.json` `buildCommand` under the 256-char API limit
 * while applying the same reliability defaults as the previous inline env chain.
 *
 * Deploy uploads the monorepo root with framework=nextjs. The deploy bundle copies
 * apps/dashboard/app + public to the upload root; we still compile in apps/dashboard,
 * then mirror `.next` to the monorepo root where Vercel's Next builder expects it.
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

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: appRoot,
  env: process.env,
})

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}

const builtNext = path.join(appRoot, process.env.NEXT_BUILD_DIST_DIR || '.next')
const rootNext = path.join(monorepoRoot, '.next')
if (!fs.existsSync(builtNext)) {
  console.error(`[vercel-build] missing build output: ${builtNext}`)
  process.exit(1)
}

fs.rmSync(rootNext, { recursive: true, force: true })
fs.cpSync(builtNext, rootNext, { recursive: true })
console.log(`[vercel-build] mirrored ${builtNext} -> ${rootNext}`)

process.exit(0)
