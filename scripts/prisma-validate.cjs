require('./prisma-ensure-direct-url.cjs')
const { execSync } = require('child_process')
const path = require('path')

execSync('npx prisma validate', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
})
