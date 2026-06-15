#!/usr/bin/env node
/**
 * Fail fast when Docker Desktop Linux engine is unhealthy (Windows sidecar bring-up).
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outDir, { recursive: true })
const outputPath = path.join(outDir, `${stamp}-docker-desktop-health.md`)

function tryDocker(args) {
  const r = spawnSync('docker', args, { encoding: 'utf8', timeout: 60000 })
  const err = (r.stderr || r.stdout || '').trim()
  const ok = r.status === 0
  return { ok, err: err.slice(0, 500) }
}

const version = tryDocker(['version', '--format', '{{.Server.Version}}'])
const ps = tryDocker(['ps', '--format', '{{.Names}}'])
const wslPs = spawnSync('wsl', ['-e', 'docker', 'ps', '--format', '{{.Names}}'], {
  encoding: 'utf8',
  timeout: 60000,
})

const ok = version.ok && ps.ok
const lines = [
  '# Docker Desktop health',
  '',
  `- Timestamp: ${iso}`,
  `- docker version (server): ${version.ok ? 'PASS' : 'FAIL'}`,
  `- docker ps: ${ps.ok ? 'PASS' : 'FAIL'}`,
  `- wsl docker ps: ${wslPs.status === 0 ? 'PASS' : 'FAIL'}`,
  '',
  '## Recovery',
  '',
  '1. Quit and reopen **Docker Desktop** (or Settings → Troubleshoot → Restart).',
  '2. Optional: `wsl --shutdown` then start Docker Desktop again.',
  '3. Confirm `docker ps` returns without 500.',
  '4. `cd deployment/bolna && docker compose pull && docker compose up -d`',
  '',
]

if (!version.ok && version.err) lines.push('### docker version error', '', '```', version.err, '```', '')
if (!ps.ok && ps.err) lines.push('### docker ps error', '', '```', ps.err, '```', '')

writeFileSync(outputPath, `${lines.join('\n')}\n`)

console.log(
  JSON.stringify(
    {
      ok,
      outputPath,
      serverVersion: version.ok ? version.err : null,
      wslOk: wslPs.status === 0,
    },
    null,
    2,
  ),
)
process.exit(ok ? 0 : 1)
