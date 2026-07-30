/**
 * Controlled cutover helper: inventory migration folder names only (no DB).
 * Next operator step still requires live `_prisma_migrations` vs this inventory.
 *
 *   node scripts/inventory-packages-db-migrations-cutover.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const rootDir = path.join(root, 'prisma', 'migrations')
const pkgDir = path.join(root, 'packages', 'db', 'prisma', 'migrations')

function dirs(p) {
  if (!fs.existsSync(p)) return []
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'migration_lock.toml')
    .map((d) => d.name)
    .sort()
}

const a = new Set(dirs(rootDir))
const b = new Set(dirs(pkgDir))
const shared = [...a].filter((x) => b.has(x))
const rootOnly = [...a].filter((x) => !b.has(x))
const pkgOnly = [...b].filter((x) => !a.has(x))

const out = {
  check: 'packages-db-migrations-cutover-inventory',
  rootCount: a.size,
  packagesDbCount: b.size,
  sharedCount: shared.length,
  rootOnly,
  pkgOnlyCount: pkgOnly.length,
  pkgOnlySample: pkgOnly.slice(0, 10),
  readyForDbCompare: rootOnly.length === 0,
  next: rootOnly.length
    ? 'Copy remaining root-only into packages/db, then compare _prisma_migrations'
    : 'Compare packages/db tree to staging/production _prisma_migrations; do not auto-deploy pkg-only folders',
}

console.log(JSON.stringify(out, null, 2))
process.exit(rootOnly.length === 0 ? 0 : 1)
