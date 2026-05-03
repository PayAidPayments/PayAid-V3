require('./prisma-ensure-direct-url.cjs')
const { execSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: root, env: process.env })
