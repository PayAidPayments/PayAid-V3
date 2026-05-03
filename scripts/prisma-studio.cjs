require('./prisma-ensure-direct-url.cjs')
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const code = spawnSync('npx', ['prisma', 'studio', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
  shell: true,
}).status
process.exit(code ?? 0)
