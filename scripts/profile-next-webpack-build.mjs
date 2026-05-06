/**
 * Bounded CPU profiler for Next/webpack production builds (profiles the Next child process).
 *
 * Spawns:
 *   node --cpu-prof --cpu-prof-dir <dir> --cpu-prof-name <name> <nextBin> build --webpack
 *
 * After duration (or early exit), lists the newest .cpuprofile written under cpu-prof-dir
 * so you can open it in Chrome DevTools -> Performance -> Load profile.
 *
 * Usage:
 *   node scripts/profile-next-webpack-build.mjs --app dashboard
 *   node scripts/profile-next-webpack-build.mjs --app crm --duration-ms 240000
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawn, execFile } from 'node:child_process'

const require = createRequire(import.meta.url)
const { resolvePayaidNodeExecutable } = require('./payaid-node-executable.cjs')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const nodeExe = resolvePayaidNodeExecutable('profile-next-webpack')

function parseArg(flag) {
  const i = process.argv.indexOf(flag)
  if (i === -1 || !process.argv[i + 1]) return null
  return process.argv[i + 1]
}

function mustAppName(v) {
  const n = String(v || '').trim().toLowerCase()
  if (n !== 'crm' && n !== 'dashboard') {
    console.error('[profile-next-webpack] Expected --app crm|dashboard')
    process.exit(1)
  }
  return n
}

function parseDurationMs(v) {
  if (v == null || v === '') return 180000
  const n = Number(v)
  if (!Number.isFinite(n) || n < 30000 || n > 3600000) {
    console.error('[profile-next-webpack] --duration-ms must be 30000..3600000')
    process.exit(1)
  }
  return Math.round(n)
}

const appName = mustAppName(parseArg('--app'))
const durationMs = parseDurationMs(parseArg('--duration-ms'))

const appDir = path.join(root, 'apps', appName)
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
if (!fs.existsSync(nextBin)) {
  console.error(`[profile-next-webpack] Missing Next binary at ${nextBin}`)
  process.exit(1)
}

const evidenceDir = path.join(root, 'docs', 'evidence', 'closure')
const cpuProfDir = path.resolve(evidenceDir, 'next-webpack-cpu-prof')
fs.mkdirSync(cpuProfDir, { recursive: true })

// Windows-friendly stamp (avoid ':' which is invalid in file names)
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/g, '_')
// Node writes the exact name you pass; include `.cpuprofile` so DevTools can open it directly.
const profName = `${stamp}-next-webpack-build-${appName}.cpuprofile`

const metaBase = `${stamp}-next-webpack-build-${appName}`
const metaPath = path.join(evidenceDir, `${metaBase}.meta.json`)

const childEnv = {
  ...process.env,
  NODE_OPTIONS: [...new Set(`${process.env.NODE_OPTIONS || ''} --max-old-space-size=6144`.trim().split(/\s+/))]
    .filter(Boolean)
    .join(' '),
}

console.log('[profile-next-webpack] app=%s cwd=%s durationMs=%s', appName, appDir, durationMs)
console.log('[profile-next-webpack] nodeExe=%s', nodeExe)
console.log('[profile-next-webpack] cpu-prof-dir=%s name=%s', path.relative(root, cpuProfDir), profName)

const child = spawn(nodeExe, [
  '--cpu-prof',
  `--cpu-prof-dir=${cpuProfDir}`,
  `--cpu-prof-name=${profName}`,
  nextBin,
  'build',
  '--webpack',
], {
  cwd: appDir,
  env: childEnv,
  stdio: 'inherit',
})

const meta = {
  startedAt: new Date().toISOString(),
  appName,
  appDir,
  durationMs,
  nextBin: path.relative(root, nextBin),
  nodeExe,
  node: process.version,
  cpuProfDir: path.relative(root, cpuProfDir),
  cpuProfName: profName,
  envEcho: {
    PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS: process.env.PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS ?? null,
    PAYAID_DISABLE_TRANSPILE_PACKAGES: process.env.PAYAID_DISABLE_TRANSPILE_PACKAGES ?? null,
    NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING: process.env.NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING ?? null,
  },
  pid: child.pid,
}

function hardKillWindowsPid(pid) {
  if (!pid) return
  // On Windows, spawned processes are often `cmd.exe` wrappers; `taskkill` terminates the whole subtree.
  if (process.platform === 'win32') {
    execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => {})
    return
  }
  try {
    process.kill(pid, 'SIGKILL')
  } catch (_) {}
}

const killTimer = setTimeout(() => {
  console.warn(`[profile-next-webpack] Duration window reached (${durationMs}ms); forcing process tree termination`)
  try {
    hardKillWindowsPid(child.pid)
  } catch (_) {}
  setTimeout(() => {
    if (!child.killed) {
      console.warn('[profile-next-webpack] Child still alive after kill attempt; retry SIGTERM')
      try {
        child.kill('SIGTERM')
      } catch (_) {}
    }
  }, 5000).unref()
}, durationMs).unref()

function findNewestCpuProfile(sinceMs) {
  const files = fs
    .readdirSync(cpuProfDir)
    .map((f) => {
      const p = path.join(cpuProfDir, f)
      const st = fs.statSync(p)
      if (!st.isFile()) return null
      return { p, mtimeMs: st.mtimeMs, size: st.size, name: f }
    })
    .filter(Boolean)
    .filter((x) => x.mtimeMs >= sinceMs - 2000)
  files.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return files[0]?.p ?? null
}

function summarizeCpuProfile(profilePath) {
  try {
    const raw = fs.readFileSync(profilePath, 'utf8')
    const j = JSON.parse(raw)
    const nodes = j.nodes || []
    const ranked = [...nodes].sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0)).slice(0, 12)
    return ranked.map((n) => ({
      hits: n.hitCount || 0,
      fn: n.callFrame?.functionName || '',
      url: (n.callFrame?.url || '').slice(0, 120),
    }))
  } catch {
    return null
  }
}

child.on('error', (err) => {
  clearTimeout(killTimer)
  console.error('[profile-next-webpack] spawn error:', err)
  meta.error = String(err.message || err)
  meta.finishedAt = new Date().toISOString()
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  process.exit(1)
})

const startMs = Date.now()
child.on('exit', (code, signal) => {
  clearTimeout(killTimer)
  meta.exitCode = code
  meta.exitSignal = signal
  meta.finishedAt = new Date().toISOString()

  const profPath = findNewestCpuProfile(startMs)
  if (profPath) {
    meta.cpuProfileRel = path.relative(root, profPath)
    const tops = summarizeCpuProfile(profPath)
    if (tops) meta.topCallFramesByHits = tops
  } else {
    meta.cpuProfileRel = null
    meta.note = 'No .cpuprofile found under cpu-prof-dir after run (profiler may still be flushing).'
  }

  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  console.log('[profile-next-webpack] meta written: %s', path.relative(root, metaPath))
  if (meta.cpuProfileRel) {
    console.log('[profile-next-webpack] cpu profile file: %s', meta.cpuProfileRel)
    if (meta.topCallFramesByHits) console.log('[profile-next-webpack] top frames (hits):')
    console.log(JSON.stringify(meta.topCallFramesByHits || [], null, 2))
  } else {
    console.log('[profile-next-webpack] cpu profile missing; inspect cpu-prof-dir manually:', path.relative(root, cpuProfDir))
  }

  // Non-zero exits are expected when we SIGTERM intentionally.
  process.exit(code === 0 ? 0 : 1)
})
