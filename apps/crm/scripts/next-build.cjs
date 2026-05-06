const path = require('node:path')
const { spawn } = require('node:child_process')
const {
  resolvePayaidNodeExecutable,
} = require(path.join(__dirname, '..', '..', '..', 'scripts', 'payaid-node-executable.cjs'))
const nodeExe = resolvePayaidNodeExecutable('crm-next-build')

const nextBin = require.resolve('next/dist/bin/next')
const rawTimeout = process.env.NEXT_BUILD_TIMEOUT_MS
const buildTimeoutMs =
  rawTimeout === '' || rawTimeout === undefined
    ? 10 * 60 * 1000
    : Number(rawTimeout)

function runBuild() {
  return new Promise((resolve) => {
    const args = ['build', '--webpack']
    console.log(`[crm-next-build] running: next ${args.join(' ')} (node=${nodeExe})`)
    const child = spawn(nodeExe, [nextBin, ...args], {
      stdio: 'inherit',
      env: process.env,
    })

    const timeout =
      Number.isFinite(buildTimeoutMs) && buildTimeoutMs > 0
        ? setTimeout(() => {
            console.error(
              `[crm-next-build] build timed out after ${buildTimeoutMs}ms; terminating child process`
            )
            child.kill('SIGTERM')
          }, buildTimeoutMs)
        : null

    if (rawTimeout === '0' || buildTimeoutMs === 0) {
      console.log('[crm-next-build] NEXT_BUILD_TIMEOUT_MS=0 - timeout disabled')
    }

    child.on('exit', (code, signal) => {
      if (timeout) clearTimeout(timeout)
      resolve({ code: code ?? 1, signal })
    })
  })
}

;(async () => {
  const result = await runBuild()
  if (result.signal) {
    console.error(`[crm-next-build] terminated by signal: ${result.signal}`)
    process.exit(1)
  }
  process.exit(result.code)
})().catch((error) => {
  console.error('[crm-next-build] unexpected failure:', error)
  process.exit(1)
})
