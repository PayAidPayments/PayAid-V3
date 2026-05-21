#!/usr/bin/env node
/**
 * Runs diagnose-next-build.mjs while sampling top node.exe processes (Windows)
 * for memory/working-set signatures during long webpack/Next phases.
 *
 * Usage:
 *   node scripts/run-diagnose-with-build-metrics.mjs [--interval-ms 15000] -- --app apps/crm [--skip-tsc]
 *
 * Writes:
 *   docs/evidence/closure/<stamp>-next-build-diagnose-<app>-metrics.ndjson
 *   docs/evidence/closure/<stamp>-next-build-diagnose-<app>-metrics.meta.json
 *
 * Non-Windows: still runs diagnose; NDJSON lines record { note: 'metrics skipped (non-win32)' }.
 *
 * Env:
 *   PAYAID_NODE_EXECUTABLE — optional; forwarded via scripts/payaid-node-executable.cjs (diagnose child uses resolved Node too).
 */

import { execFile, spawn } from 'node:child_process'
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { resolvePayaidNodeExecutable } = require('./payaid-node-executable.cjs')
const nodeForSpawns = resolvePayaidNodeExecutable('diagnose-metrics')

const root = process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  const dash = process.argv.indexOf('--')
  let intervalMs = 10000
  let diagnoseArgs

  if (dash === -1) {
    const rest = process.argv.slice(2)
    diagnoseArgs = []
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--interval-ms' && rest[i + 1]) {
        intervalMs = Number(rest[i + 1])
        i++
        continue
      }
      diagnoseArgs.push(rest[i])
    }
  } else {
    const before = process.argv.slice(2, dash)
    diagnoseArgs = process.argv.slice(dash + 1)
    for (let i = 0; i < before.length; i++) {
      if (before[i] === '--interval-ms' && before[i + 1]) {
        intervalMs = Number(before[i + 1])
        i++
      }
    }
  }

  if (!Number.isFinite(intervalMs) || intervalMs < 1000) intervalMs = 10000
  return { intervalMs, diagnoseArgs }
}

function parseAppName(diagnoseArgs) {
  const i = diagnoseArgs.indexOf('--app')
  if (i === -1 || !diagnoseArgs[i + 1]) return 'unknown'
  const appRel = diagnoseArgs[i + 1]
  return path.basename(path.resolve(root, appRel))
}

function sampleWindowsNodeProcesses() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ note: 'metrics skipped (non-win32)' })
      return
    }

    const psScript = `
$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | ForEach-Object {
  $cmd = $_.CommandLine
  if ($null -eq $cmd) { $cmd = '' }
  elseif ($cmd.Length -gt 240) { $cmd = $cmd.Substring(0, 240) }
  [PSCustomObject]@{
    pid = [int]$_.ProcessId
    wsMb = [math]::Round($_.WorkingSetSize / 1MB, 2)
    cmd = $cmd
  }
}
$arr = @($procs | Sort-Object wsMb -Descending | Select-Object -First 35)
if ($arr.Count -eq 0) { '[]' } else { ($arr | ConvertTo-Json -Compress) }
`.trim()

    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          resolve({ error: String(err.message || err) })
          return
        }
        const t = (stdout || '').trim()
        if (!t || t === '[]') {
          resolve({ samples: [] })
          return
        }
        try {
          const parsed = JSON.parse(t)
          resolve({ samples: Array.isArray(parsed) ? parsed : [parsed] })
        } catch {
          resolve({ error: 'json-parse', raw: t.slice(0, 400) })
        }
      }
    )
  })
}

;(async () => {
  const { intervalMs, diagnoseArgs } = parseArgs()
  const appI = diagnoseArgs.indexOf('--app')
  if (appI === -1 || !diagnoseArgs[appI + 1]) {
    console.error(
      'Usage: node scripts/run-diagnose-with-build-metrics.mjs [--interval-ms 10000] -- --app apps/crm [--skip-tsc]'
    )
    process.exit(1)
  }

  const appName = parseAppName(diagnoseArgs)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(root, 'docs', 'evidence', 'closure')
  mkdirSync(outDir, { recursive: true })
  const ndjsonPath = path.join(outDir, `${stamp}-next-build-diagnose-${appName}-metrics.ndjson`)
  const metaPath = path.join(outDir, `${stamp}-next-build-diagnose-${appName}-metrics.meta.json`)
  const stream = createWriteStream(ndjsonPath, { flags: 'a' })

  function writeRecord(obj) {
    return new Promise((res, rej) => {
      stream.write(`${JSON.stringify(obj)}\n`, (e) => (e ? rej(e) : res()))
    })
  }

  const start = Date.now()
  let timer = null
  let stopping = false

  async function tick() {
    const row = { ts: new Date().toISOString(), ...(await sampleWindowsNodeProcesses()) }
    await writeRecord(row)
  }

  await tick()

  const schedule = () => {
    timer = setTimeout(async () => {
      if (stopping) return
      try {
        await tick()
      } catch {
        /* ignore sample errors */
      }
      if (!stopping) schedule()
    }, intervalMs)
  }
  schedule()

  const diagnoseScript = path.join(__dirname, 'diagnose-next-build.mjs')
  const child = spawn(nodeForSpawns, [diagnoseScript, ...diagnoseArgs], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  })

  const exit = await new Promise((resolve) => {
    child.on('exit', (code, signal) => resolve({ code: code ?? 1, signal }))
    child.on('error', () => resolve({ code: 1, signal: null }))
  })

  stopping = true
  if (timer) clearTimeout(timer)
  try {
    await tick()
  } catch {
    /* ignore */
  }

  await new Promise((res) => stream.end(res))

  writeFileSync(
    metaPath,
    `${JSON.stringify(
      {
        intervalMs,
        app: appName,
        startedAt: new Date(start).toISOString(),
        durationMs: Date.now() - start,
        exitCode: exit.code,
        signal: exit.signal,
        ndjsonPath: path.relative(root, ndjsonPath),
        platform: process.platform,
      },
      null,
      2
    )}\n`
  )

  console.log(`\nMetrics NDJSON: ${path.relative(root, ndjsonPath)}`)
  console.log(`Metrics meta: ${path.relative(root, metaPath)}`)

  process.exit(exit.code === 0 ? 0 : 1)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
