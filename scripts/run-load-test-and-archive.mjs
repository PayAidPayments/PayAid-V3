import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'docs', 'evidence', 'load-tests')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const startedAt = new Date()
const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(outDir, `${stamp}-load-test.json`)

const command = ['node', 'node_modules/jest/bin/jest.js', '--runInBand', 'tests/performance/load.test.ts']
console.log(`[load-test] Running: ${command.join(' ')}`)

const run = spawnSync(command[0], command.slice(1), {
  cwd: root,
  env: process.env,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 16 * 1024 * 1024,
  timeout: Number(process.env.LOAD_TEST_TIMEOUT_MS || 180000),
})

const artifact = {
  collected_at_utc: startedAt.toISOString(),
  command: command.join(' '),
  exit_code: typeof run.status === 'number' ? run.status : 1,
  timed_out: Boolean(run.error && 'code' in run.error && run.error.code === 'ETIMEDOUT'),
  output_excerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-80).join('\n'),
}

fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
console.log(`[load-test] Artifact written: ${artifactPath}`)

if (artifact.exit_code !== 0) process.exit(artifact.exit_code)

