/**
 * Vercel build entrypoint: keeps `vercel.json` `buildCommand` under the 256-char API limit
 * while applying the same reliability defaults as the previous inline env chain.
 */
const { spawnSync } = require('node:child_process')

function setDefault(name, value) {
  if (process.env[name] === undefined || process.env[name] === '') {
    process.env[name] = value
  }
}

setDefault('NEXT_BUILD_DIST_DIR', '.next-vercel-build')
// Disable local watchdog on Vercel; rely on platform timeout to avoid killing
// long-running page-data collection jobs that would otherwise eventually finish.
setDefault('NEXT_BUILD_TIMEOUT_MS', '0')
setDefault('NEXT_BUILD_KILL_GRACE_MS', '15000')
setDefault('NEXT_BUILD_HEARTBEAT_MS', '60000')
setDefault('NEXT_BUILD_PREFERRED_MODE', 'webpack')
setDefault('NEXT_BUILD_ALLOW_ALTERNATE_RETRY', '1')
setDefault('NEXT_BUILD_CLEAR_STALE_LOCK', '1')
setDefault('NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING', '1')
setDefault('VERCEL_ALLOW_WEBPACK_FALLBACK', '1')
setDefault('NODE_OPTIONS', '--max-old-space-size=6144')

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
