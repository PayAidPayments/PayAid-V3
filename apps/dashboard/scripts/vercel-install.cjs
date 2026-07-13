/**
 * Monorepo install for dashboard Vercel builds.
 * Avoids `cd ../.. && npm install` which can race Vercel's installer and trigger
 * npm "Tracker idealTree already exists" on Node 24 builders.
 */
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '../../..')

const result = spawnSync(
  'npm',
  ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }
)

process.exit(result.status === 0 ? 0 : result.status ?? 1)
