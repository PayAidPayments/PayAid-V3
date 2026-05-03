require('./prisma-ensure-direct-url.cjs')

/**
 * Mark every migration in prisma/migrations as already applied (no SQL run).
 *
 * Use once when `prisma migrate deploy` fails with P3005: your Supabase DB already
 * matches this history (from db push / manual SQL / older workflow) but `_prisma_migrations`
 * is empty or out of sync.
 *
 * WARNING: Only run if you are sure the database already contains the effects of these
 * migrations. If anything is missing, fix with SQL or a new migration after baselining.
 *
 * Usage (repo root, DATABASE_URL set):
 *   node scripts/prisma-baseline-resolve-all.cjs
 *
 * Then: npm run db:migrate:deploy
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const migDir = path.join(root, 'prisma', 'migrations')

if (!fs.existsSync(migDir)) {
  console.error('[baseline] prisma/migrations not found')
  process.exit(1)
}

const names = fs
  .readdirSync(migDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(migDir, d.name, 'migration.sql')))
  .map((d) => d.name)
  .sort()

if (names.length === 0) {
  console.error('[baseline] No migration folders with migration.sql found')
  process.exit(1)
}

console.log('')
console.log('══════════════════════════════════════════════════════════')
console.log('  Prisma baseline: mark migrations as applied (no SQL)')
console.log(`  Migrations: ${names.length}`)
console.log('  Only continue if your database already matches this history.')
console.log('══════════════════════════════════════════════════════════')
console.log('')

for (const name of names) {
  console.log(`\n→ resolve --applied "${name}"`)
  try {
    execSync(`npx prisma migrate resolve --applied "${name}"`, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env },
      shell: true,
    })
  } catch {
    console.warn(`   (skipped or failed — may already be recorded; check output above)`)
  }
}

console.log('\n[baseline] Done. Next: npm run db:migrate:deploy\n')
