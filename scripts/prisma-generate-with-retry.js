/**
 * Run prisma generate with retries. Helps on Windows where "write UNKNOWN" / EPERM
 * can occur due to file locks or antivirus. Between retries we try to remove stale
 * query engine binaries under node_modules/.prisma/client so the next rename can succeed.
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const strict = process.env.PRISMA_GENERATE_STRICT === '1' || process.env.PRISMA_GENERATE_STRICT === 'true'
const maxAttempts = Math.max(
  1,
  parseInt(process.env.PRISMA_GENERATE_MAX_ATTEMPTS || (strict ? '6' : '3'), 10)
)
const retryDelayMs = parseInt(process.env.PRISMA_GENERATE_RETRY_MS || '6000', 10)
const projectRoot = path.resolve(__dirname, '..')
const prismaClientDir = path.join(projectRoot, 'node_modules', '.prisma', 'client')
const clientPaths = [
  path.join(prismaClientDir, 'index.js'),
  path.join(projectRoot, 'node_modules', '@prisma', 'client', 'index.js'),
]

function cleanupPrismaEngineArtifacts() {
  try {
    if (!fs.existsSync(prismaClientDir)) return
    const names = fs.readdirSync(prismaClientDir)
    for (const name of names) {
      if (
        name === 'query_engine-windows.dll.node' ||
        /^query_engine-windows\.dll\.node\.tmp\d+$/i.test(name) ||
        (name.startsWith('query_engine-') && name.endsWith('.tmp'))
      ) {
        try {
          fs.unlinkSync(path.join(prismaClientDir, name))
        } catch {
          // still locked; next attempt may succeed
        }
      }
    }
  } catch {
    // ignore
  }
}

function sleepSync(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {}
}

function clientExists() {
  for (const clientIndex of clientPaths) {
    try {
      if (fs.existsSync(clientIndex) && fs.statSync(clientIndex).size > 0) return true
    } catch {
      // continue
    }
  }
  return false
}

function runGenerate() {
  const result = spawnSync(
    'npx',
    ['prisma', 'generate'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    }
  )
  return result.status
}

let lastStatus = 1
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  if (attempt > 1) {
    console.log(`\n[prisma-generate] Retry ${attempt}/${maxAttempts} after ${retryDelayMs}ms...\n`)
    sleepSync(retryDelayMs)
    cleanupPrismaEngineArtifacts()
  }
  lastStatus = runGenerate()
  // Exit 0 on explicit success, or on Windows sometimes npx returns 3221225786 (0xC000013A) despite success
  if (lastStatus === 0 || lastStatus === 3221225786) {
    if (lastStatus !== 0 && clientExists()) {
      console.warn('\n[prisma-generate] prisma generate completed (Windows exit code). Proceeding.')
    }
    process.exit(0)
  }
}

if (!strict && clientExists()) {
  console.warn('\n[prisma-generate] prisma generate failed but existing client found. Proceeding with build.')
  process.exit(0)
}

console.error('\n[prisma-generate] prisma generate failed after', maxAttempts, 'attempt(s).')
console.error(
  'On Windows, try: close IDE/Node processes locking node_modules\\.prisma, pause AV for the repo folder, run from an external terminal, or run as Administrator.'
)
process.exit(1)
