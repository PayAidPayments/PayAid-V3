import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'docs', 'evidence', 'release-gates')

const gates = [
  { id: 'm0', command: ['npm', 'run', 'test:m0'] },
  { id: 'm2', command: ['npm', 'run', 'test:m2:smoke', '--', '--runInBand'] },
  { id: 'm3', command: ['npm', 'run', 'test:m3:smoke', '--', '--runInBand'] },
]

const include = new Set((process.env.RELEASE_GATES || 'm0,m2,m3').split(',').map((x) => x.trim()).filter(Boolean))
const selected = gates.filter((g) => include.has(g.id))

if (selected.length === 0) {
  console.error('[release-gate] No gates selected. Set RELEASE_GATES=m0,m2,m3 subset.')
  process.exit(1)
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const startedAt = new Date()
const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(outDir, `${stamp}-release-gate-suite.json`)

const results = []
let allPass = true

for (const gate of selected) {
  const gateStart = Date.now()
  const [cmd, ...args] = gate.command
  console.log(`[release-gate] Running ${gate.id}: ${cmd} ${args.join(' ')}`)
  const run = spawnSync(cmd, args, {
    cwd: root,
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 16 * 1024 * 1024,
  })
  const durationMs = Date.now() - gateStart
  const stdout = run.stdout || ''
  const stderr = run.stderr || ''
  const exitCode = typeof run.status === 'number' ? run.status : 1

  results.push({
    gate: gate.id,
    command: [cmd, ...args].join(' '),
    exit_code: exitCode,
    duration_ms: durationMs,
    output_excerpt: (stdout + '\n' + stderr).split('\n').slice(-60).join('\n'),
  })

  if (exitCode !== 0) allPass = false
}

const artifact = {
  collected_at_utc: startedAt.toISOString(),
  selected_gates: selected.map((g) => g.id),
  all_pass: allPass,
  results,
}

fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
console.log(`[release-gate] Artifact written: ${artifactPath}`)
console.log(`[release-gate] Result: ${allPass ? 'PASS' : 'FAIL'}`)

if (!allPass) process.exit(1)

