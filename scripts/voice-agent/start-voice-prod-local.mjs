#!/usr/bin/env node
/**
 * Production build + next start on PORT (default 3003) for Stage 1 bridge smoke.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const port = process.env.PORT || '3003'

console.log('Building voice workspace...')
const build = spawnSync('npm', ['run', 'build', '-w', 'voice'], { cwd: root, stdio: 'inherit', shell: true })
if (build.status !== 0) process.exit(build.status ?? 1)

console.log(`Starting voice on http://127.0.0.1:${port} ...`)
const start = spawnSync('npm', ['run', 'start', '-w', 'voice'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
  shell: true,
})
process.exit(start.status ?? 0)
