import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'docs', 'evidence', 'release-gates')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const startedAt = new Date()
const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(outDir, `${stamp}-crm-audit-gate.json`)

const command = ['npm', 'run', 'test:e2e:crm-audit']
console.log(`[crm-audit-gate] Running: ${command.join(' ')}`)

const run = spawnSync(command[0], command.slice(1), {
  cwd: root,
  env: process.env,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 16 * 1024 * 1024,
  timeout: Number(process.env.CRM_AUDIT_TIMEOUT_MS || 300000),
})

const artifact = {
  collected_at_utc: startedAt.toISOString(),
  command: command.join(' '),
  exit_code: typeof run.status === 'number' ? run.status : 1,
  timed_out: Boolean(run.error && 'code' in run.error && run.error.code === 'ETIMEDOUT'),
  output_excerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-120).join('\n'),
}

fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
console.log(`[crm-audit-gate] Artifact written: ${artifactPath}`)

if (artifact.exit_code !== 0) process.exit(artifact.exit_code)

