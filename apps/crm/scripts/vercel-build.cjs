/**
 * Vercel CRM build entrypoint: apply memory defaults then prisma generate + next build.
 */
const { spawnSync } = require('node:child_process')
const path = require('node:path')

function setDefault(name, value) {
  if (process.env[name] === undefined || process.env[name] === '') {
    process.env[name] = value
  }
}

setDefault('VERCEL', '1')
setDefault('VERCEL_ENV', 'production')
setDefault('GENERATE_SOURCEMAP', 'false')
setDefault('PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS', '1')
setDefault('NODE_OPTIONS', '--max-old-space-size=4096')
setDefault('UV_THREADPOOL_SIZE', '1')

const schema = path.join(__dirname, '../../../packages/db/prisma/schema.prisma')
const prisma = spawnSync('npx', ['prisma', 'generate', `--schema=${schema}`], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})
if (prisma.status !== 0) {
  process.exit(prisma.status ?? 1)
}

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, '..'),
})
process.exit(build.status ?? 1)
