/**
 * Vercel runs with the monorepo root as the project root, but `next build` for
 * `apps/dashboard` writes to `apps/dashboard/.next`. The Next builder then looks
 * for `.next/` at the repo root. Copy the dashboard output after build.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'apps', 'dashboard', '.next')
const dest = path.join(root, '.next')

if (!fs.existsSync(src)) {
  console.error('[vercel-stage-dashboard-next] Missing build output:', src)
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
fs.cpSync(src, dest, { recursive: true })
console.log('[vercel-stage-dashboard-next] Staged', src, '->', dest)
