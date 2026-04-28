const { spawn } = require('node:child_process')

// Only treat as Vercel when both flags are present. Some local shells or .env files set
// `VERCEL=1` alone, which incorrectly forces Turbopack and breaks local builds.
const isVercel =
  process.env.VERCEL === '1' &&
  ['production', 'preview', 'development'].includes(String(process.env.VERCEL_ENV || ''))
const nextBin = require.resolve('next/dist/bin/next')
const buildTimeoutMs = Number(process.env.NEXT_BUILD_TIMEOUT_MS || 15 * 60 * 1000)

if (isVercel) {
  // Keep Vercel builds conservative on memory-constrained workers.
  process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || '1'
}

function runBuild(mode) {
  return new Promise((resolve) => {
    const args = ['build', mode === 'turbopack' ? '--turbopack' : '--webpack']
    console.log(`[next-build] running: next ${args.join(' ')}`)
    const child = spawn(process.execPath, [nextBin, ...args], {
      stdio: 'inherit',
      env: process.env,
    })
    const timeout = setTimeout(() => {
      console.error(
        `[next-build] ${mode} build timed out after ${buildTimeoutMs}ms; terminating child process`
      )
      child.kill('SIGTERM')
    }, buildTimeoutMs)

    child.on('exit', (code, signal) => {
      clearTimeout(timeout)
      resolve({ code: code ?? 1, signal })
    })
  })
}

;(async () => {
  const envMode = String(process.env.NEXT_BUILD_PREFERRED_MODE || '').trim().toLowerCase()
  const preferredMode =
    envMode === 'webpack' || envMode === 'turbopack'
      ? envMode
      : isVercel
        ? 'turbopack'
        : 'webpack'
  const first = await runBuild(preferredMode)
  if (first.signal) {
    console.error(`[next-build] terminated by signal: ${first.signal}`)
    process.exit(1)
  }
  if (first.code === 0) {
    process.exit(0)
  }

  // Turbopack can fail on some server-relative imports (e.g. Bull internals).
  // Retry with webpack for compatibility before failing the build.
  if (preferredMode === 'turbopack') {
    if (isVercel && process.env.VERCEL_ALLOW_WEBPACK_FALLBACK !== '1') {
      console.error(
        '[next-build] turbopack failed on Vercel and webpack fallback is disabled to avoid hanging builds'
      )
      process.exit(first.code)
    }
    console.warn('[next-build] turbopack failed; retrying with webpack fallback')
    const fallback = await runBuild('webpack')
    if (fallback.signal) {
      console.error(`[next-build] webpack fallback terminated by signal: ${fallback.signal}`)
      process.exit(1)
    }
    process.exit(fallback.code)
  }

  process.exit(first.code)
})().catch((err) => {
  console.error('[next-build] unexpected failure:', err)
  process.exit(1)
})
