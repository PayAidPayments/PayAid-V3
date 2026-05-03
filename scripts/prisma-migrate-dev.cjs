require('./prisma-ensure-direct-url.cjs')
const { execSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const extra = process.argv.slice(2).join(' ')
execSync(`npx prisma migrate dev ${extra}`.trim(), {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
  shell: true,
})
