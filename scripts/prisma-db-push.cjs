require('./prisma-ensure-direct-url.cjs')
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const extra = process.argv.slice(2)
const args = ['prisma', 'db', 'push', ...extra]
const r = spawnSync('npx', args, { stdio: 'inherit', cwd: root, env: process.env, shell: true })
process.exit(r.status ?? 0)
