import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'docs', 'evidence', 'lint')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const startedAt = new Date()
const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(outDir, `${stamp}-dashboard-lint-baseline.json`)

const run = spawnSync('npm', ['run', 'lint', '-w', 'dashboard'], {
  cwd: root,
  env: process.env,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: process.platform === 'win32',
  timeout: Number(process.env.LINT_TIMEOUT_MS || 420000),
  maxBuffer: 32 * 1024 * 1024,
})

const combined = `${run.stdout || ''}\n${run.stderr || ''}`
const match = combined.match(/✖\s+(\d+)\s+problems\s+\((\d+)\s+errors,\s+(\d+)\s+warnings\)/)

const artifact = {
  collected_at_utc: startedAt.toISOString(),
  command: 'npm run lint -w dashboard',
  exit_code: typeof run.status === 'number' ? run.status : 1,
  timed_out: Boolean(run.error && 'code' in run.error && run.error.code === 'ETIMEDOUT'),
  summary: match
    ? {
        total_problems: Number(match[1]),
        errors: Number(match[2]),
        warnings: Number(match[3]),
        lint_target_errors_lte_50_met: Number(match[2]) <= 50,
      }
    : null,
  output_excerpt: combined.split('\n').slice(-120).join('\n'),
}

fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
console.log(`[lint-baseline] Artifact written: ${artifactPath}`)

if (artifact.exit_code !== 0) process.exit(artifact.exit_code)

