#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const script = path.join(root, 'scripts/voice-agent/check-bolna-stage1-bridge-wiring.ts')
const result = spawnSync(process.execPath, [tsx, script], { cwd: root, stdio: 'inherit' })
process.exit(result.status === 0 ? 0 : 1)
