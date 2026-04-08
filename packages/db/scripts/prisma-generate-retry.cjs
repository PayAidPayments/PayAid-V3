/**
 * prisma generate with retries for Windows "write UNKNOWN" / EPERM during Turbo dev.
 * See also: scripts/prisma-generate-with-retry.js (repo root schema).
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const dbRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(dbRoot, '..', '..')

const maxAttempts = 4
const retryDelayMs = parseInt(process.env.PRISMA_GENERATE_RETRY_DELAY_MS || '2000', 10) || 2000

if (process.env.SKIP_PRISMA_GENERATE === '1') {
  console.log('[@payaid/db] SKIP_PRISMA_GENERATE=1 — skipping prisma generate (for dev when client is already valid).\n')
  process.exit(0)
}

const clientIndexCandidates = [
  path.join(dbRoot, 'node_modules', '.prisma', 'client', 'index.js'),
  path.join(dbRoot, 'node_modules', '@prisma', 'client', 'index.js'),
  path.join(repoRoot, 'node_modules', '.prisma', 'client', 'index.js'),
  path.join(repoRoot, 'node_modules', '@prisma', 'client', 'index.js'),
]

function prismaClientDirHasEngineOrIndex(dir) {
  try {
    if (!fs.existsSync(dir)) return false
    const names = fs.readdirSync(dir)
    if (names.includes('index.js') || names.includes('default.js')) return true
    return names.some((n) => n.startsWith('query_engine') && (n.endsWith('.node') || n.endsWith('.so.node')))
  } catch {
    return false
  }
}

function sleepSync(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {}
}

function clientExists() {
  for (const p of clientIndexCandidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).size > 0) return true
    } catch {
      /* continue */
    }
  }
  // During a failed generate, Prisma may briefly remove index.js; engine file may still be present.
  const dirs = [
    path.join(repoRoot, 'node_modules', '.prisma', 'client'),
    path.join(dbRoot, 'node_modules', '.prisma', 'client'),
  ]
  for (const d of dirs) {
    if (prismaClientDirHasEngineOrIndex(d)) return true
  }
  return false
}

function runGenerate() {
  const result = spawnSync('npx', ['prisma', 'generate'], {
    cwd: dbRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  })
  return result.status
}

let lastStatus = 1
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  if (attempt > 1) {
    console.log(
      `\n[@payaid/db] prisma generate retry ${attempt}/${maxAttempts} (${retryDelayMs}ms delay) — Windows file locks / AV often cause "write UNKNOWN"\n`
    )
    sleepSync(retryDelayMs)
  }
  lastStatus = runGenerate()
  if (lastStatus === 0 || lastStatus === 3221225786) {
    process.exit(0)
  }
  // Windows EPERM/rename on query_engine often leaves a good client from a prior run.
  // Failing fast avoids ~15s+ of sleeps + redundant generates (same outcome as the final fallback below).
  if (clientExists()) {
    console.warn(
      `\n[@payaid/db] prisma generate failed (attempt ${attempt}/${maxAttempts}) but a Prisma client already exists; continuing.\n` +
        'If you changed the schema, close other Node/Cursor processes, exclude the repo from AV, then: cd packages/db && npx prisma generate\n'
    )
    process.exit(0)
  }
}

if (clientExists()) {
  console.warn(
    '\n[@payaid/db] prisma generate failed but a non-empty Prisma client exists. Continuing (run `npm run db:generate` in packages/db if you changed the schema).\n'
  )
  process.exit(0)
}

console.error('\n[@payaid/db] prisma generate failed after', maxAttempts, 'attempt(s).')
console.error('Try: close other Node/Cursor terminals, pause antivirus on the repo folder, then: cd packages/db && npx prisma generate')
process.exit(1)
