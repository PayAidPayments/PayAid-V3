/**
 * Run prisma generate with retries. Helps on Windows where "write UNKNOWN" / EPERM
 * can occur due to file locks or antivirus. Retries twice with a delay, then
 * if the client already exists (e.g. from a previous run), exits 0 so build can continue.
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const maxAttempts = 2
const retryDelayMs = 4000
const projectRoot = path.resolve(__dirname, '..')
const clientPaths = [
  path.join(projectRoot, 'node_modules', '.prisma', 'client', 'index.js'),
  path.join(projectRoot, 'node_modules', '@prisma', 'client', 'index.js'),
]

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

if (clientExists()) {
  console.warn('\n[prisma-generate] prisma generate failed but existing client found. Proceeding with build.')
  process.exit(0)
}

console.error('\n[prisma-generate] prisma generate failed after', maxAttempts, 'attempt(s).')
console.error('On Windows, try: close other tools using node_modules, run terminal as Administrator, or run: npm run db:generate')
process.exit(1)
