const { spawn } = require('node:child_process')

const isVercel = process.env.VERCEL === '1'
const nextBin = require.resolve('next/dist/bin/next')
const args = ['build', isVercel ? '--turbopack' : '--webpack']

if (isVercel) {
  // Keep Vercel builds conservative on memory-constrained workers.
  process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || '1'
}

console.log(`[next-build] running: next ${args.join(' ')}`)

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[next-build] terminated by signal: ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
