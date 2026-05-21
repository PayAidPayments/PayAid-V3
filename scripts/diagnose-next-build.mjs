#!/usr/bin/env node
/**
 * Timestamps Phase A (tsc --noEmit) vs Phase B (next build) for a workspace app.
 * Writes a line-prefixed log under docs/evidence/closure for post-mortems.
 *
 * Usage:
 *   node scripts/diagnose-next-build.mjs --app apps/crm
 *   node scripts/diagnose-next-build.mjs --app apps/crm --skip-tsc
 *
 * Env:
 *   NEXT_BUILD_TIMEOUT_MS — read by apps/crm/scripts/next-build.cjs (0 = no kill)
 *   DIAG_TSC_TIMEOUT_MS — tsc phase only; default 600000 (0 = no kill on tsc)
 *   PAYAID_NODE_EXECUTABLE — optional path to Node for tsc + next-build child (see scripts/payaid-node-executable.cjs)
 */

import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { resolvePayaidNodeExecutable } = require('./payaid-node-executable.cjs')
const nodeForSpawns = resolvePayaidNodeExecutable('diagnose-next-build')

const root = process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArg(name) {
  const i = process.argv.indexOf(name)
  if (i === -1 || !process.argv[i + 1]) return null
  return process.argv[i + 1]
}

const appRel = parseArg('--app')
const skipTsc = process.argv.includes('--skip-tsc')

if (!appRel) {
  console.error('Usage: node scripts/diagnose-next-build.mjs --app apps/crm [--skip-tsc]')
  process.exit(1)
}

const appDir = path.resolve(root, appRel)
const appName = path.basename(appDir)
const tsconfigPath = path.join(appDir, 'tsconfig.json')

const rawTscTimeout = process.env.DIAG_TSC_TIMEOUT_MS
const tscTimeoutMs =
  rawTscTimeout === '' || rawTscTimeout === undefined
    ? 600000
    : Number(rawTscTimeout)

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = path.join(root, 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const logPath = path.join(outDir, `${stamp}-next-build-diagnose-${appName}.log`)
const logStream = createWriteStream(logPath, { flags: 'a' })

function iso() {
  return new Date().toISOString()
}

function logLine(stream, phase, line) {
  const msg = `[${iso()}] [${phase}] ${line}`
  console.log(msg)
  stream.write(`${msg}\n`)
}

function formatEnvMetaLine(key, maxLen = 220) {
  const raw = process.env[key]
  if (raw === undefined) return `${key}=<unset>`
  if (raw.length > maxLen) return `${key}=${raw.slice(0, maxLen - 3)}...`
  return `${key}=${raw}`
}

async function runCommand(phase, cmd, args, options, killAfterMs = null) {
  return new Promise((resolve) => {
    logLine(logStream, phase, `spawn: ${cmd} ${args.join(' ')}`)
    const start = Date.now()
    const child = spawn(cmd, args, {
      ...options,
      // shell: true breaks paths with spaces on Windows; use arrays + shell:false for node/npx.
      shell: options.shell ?? false,
    })

    let timer = null
    if (
      killAfterMs != null &&
      Number.isFinite(killAfterMs) &&
      killAfterMs > 0
    ) {
      timer = setTimeout(() => {
        logLine(logStream, phase, `timeout after ${killAfterMs}ms — sending SIGTERM`)
        child.kill('SIGTERM')
      }, killAfterMs)
    }

    const onData = (buf) => {
      const s = buf.toString().replace(/\r/g, '')
      for (const line of s.split('\n')) {
        if (line.length === 0) continue
        logLine(logStream, phase, line)
      }
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)

    child.on('exit', (code, signal) => {
      if (timer) clearTimeout(timer)
      const ms = Date.now() - start
      logLine(
        logStream,
        phase,
        `exit code=${code ?? 'null'} signal=${signal ?? 'null'} durationMs=${ms}`
      )
      resolve({ code: code ?? 1, signal, ms })
    })
    child.on('error', (err) => {
      if (timer) clearTimeout(timer)
      logLine(logStream, phase, `spawn error: ${String(err.message || err)}`)
      resolve({ code: 1, signal: null, ms: Date.now() - start })
    })
  })
}

;(async () => {
  logLine(logStream, 'meta', `root=${root}`)
  logLine(logStream, 'meta', `appDir=${appDir}`)
  logLine(logStream, 'meta', `node_launcher=${process.execPath} (${process.version})`)
  logLine(logStream, 'meta', `node_for_spawns=${nodeForSpawns}`)
  logLine(
    logStream,
    'meta',
    `NEXT_BUILD_TIMEOUT_MS=${process.env.NEXT_BUILD_TIMEOUT_MS ?? '<unset>'}`
  )
  for (const envKey of [
    'NODE_OPTIONS',
    'NEXT_BUILD_PREFERRED_MODE',
    'NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING',
    'PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS',
    'PAYAID_DISABLE_TRANSPILE_PACKAGES',
    'PAYAID_WEBPACK_PROGRESS',
    'PAYAID_WEBPACK_PARALLELISM',
    'VERCEL',
    'VERCEL_ENV',
  ]) {
    logLine(logStream, 'meta', formatEnvMetaLine(envKey))
  }

  let tscResult = null
  if (!skipTsc && existsSync(tsconfigPath)) {
    logLine(
      logStream,
      'phase-a-tsc',
      'start (may be slow: CRM `@/*` resolves to repo root, so tsc follows the shared monorepo graph)'
    )
    const tscKill =
      rawTscTimeout === '0' || tscTimeoutMs === 0 ? null : tscTimeoutMs

    const tscJs = path.join(root, 'node_modules', 'typescript', 'lib', 'tsc.js')
    if (!existsSync(tscJs)) {
      logLine(logStream, 'phase-a-tsc', `skip (no ${tscJs})`)
    } else {
      tscResult = await runCommand(
        'phase-a-tsc',
        nodeForSpawns,
        [tscJs, '--noEmit', '-p', tsconfigPath],
        { cwd: root, env: process.env },
        tscKill
      )
    }
    logLine(
      logStream,
      'phase-a-tsc',
      !tscResult ? 'SKIP' : tscResult.code === 0 ? 'OK' : 'FAIL'
    )
  } else if (!skipTsc) {
    logLine(logStream, 'phase-a-tsc', `skip (no ${tsconfigPath})`)
  } else {
    logLine(logStream, 'phase-a-tsc', 'skip (--skip-tsc)')
  }

  logLine(logStream, 'phase-b-next', 'start')
  const buildScript = path.join(appDir, 'scripts', 'next-build.cjs')
  if (!existsSync(buildScript)) {
    logLine(logStream, 'phase-b-next', `missing ${buildScript}; use npm run build -w ${appName} manually`)
    logStream.end()
    console.log(`\nLog written: ${path.relative(root, logPath)}`)
    process.exit(tscResult && tscResult.code !== 0 ? tscResult.code : 1)
  }

  const buildResult = await runCommand(
    'phase-b-next',
    nodeForSpawns,
    [buildScript],
    { cwd: appDir, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } },
    null
  )
  logLine(logStream, 'phase-b-next', buildResult.code === 0 ? 'OK' : 'FAIL')
  logStream.end()

  console.log(`\nLog written: ${path.relative(root, logPath)}`)

  const fail =
    (tscResult && tscResult.code !== 0) || buildResult.code !== 0 || buildResult.signal
  process.exit(fail ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
