/**
 * Vercel build entrypoint for monorepo-root Next.js deploys.
 *
 * Git-integrated Vercel uploads the monorepo without a pre-flattened root.
 * When root next.config.mjs / full app/ are missing, prepare them from
 * apps/dashboard, then build at the monorepo root so `.next` is in-place.
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function setDefault(name, value) {
  if (process.env[name] === undefined || process.env[name] === '') {
    process.env[name] = value
  }
}

setDefault('NEXT_BUILD_DIST_DIR', '.next')
setDefault('NEXT_BUILD_TIMEOUT_MS', '0')
setDefault('NEXT_BUILD_KILL_GRACE_MS', '15000')
setDefault('NEXT_BUILD_HEARTBEAT_MS', '60000')
setDefault('NEXT_BUILD_PREFERRED_MODE', 'turbopack')
setDefault('NEXT_BUILD_ALLOW_ALTERNATE_RETRY', '0')
setDefault('NEXT_BUILD_CLEAR_STALE_LOCK', '1')
setDefault('NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING', '1')
setDefault('VERCEL_ALLOW_WEBPACK_FALLBACK', '0')
setDefault('NODE_OPTIONS', '--max-old-space-size=3584')

const appRoot = path.resolve(__dirname, '..')
const monorepoRoot = path.resolve(appRoot, '../..')

const rootApp = path.join(monorepoRoot, 'app')
const rootConfig = path.join(monorepoRoot, 'next.config.mjs')
const rootPublic = path.join(monorepoRoot, 'public')
const rootMiddleware = path.join(monorepoRoot, 'middleware.ts')
const rootProxy = path.join(monorepoRoot, 'proxy.ts')
const legacyNextConfigJs = path.join(monorepoRoot, 'next.config.js')
const legacyNextConfigCjs = path.join(monorepoRoot, 'next.config.cjs')
const dashApp = path.join(appRoot, 'app')
const dashPublic = path.join(appRoot, 'public')
const dashMiddleware = path.join(appRoot, 'middleware.ts')

function rewriteRootComponentImports() {
  // Moving apps/dashboard/app → root/app shortens path depth for legacy
  // relative imports that climbed five levels to monorepo root components/.
  const rootComponentImportFiles = [
    'dashboard/decisions/page.tsx',
    'dashboard/deals/page.tsx',
    'dashboard/contacts/page.tsx',
    'dashboard/compliance/page.tsx',
    'dashboard/collaboration/page.tsx',
  ]
  for (const rel of rootComponentImportFiles) {
    const file = path.join(rootApp, rel)
    if (!fs.existsSync(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    const rewritten = source.replace(
      /(['"])\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\//g,
      '$1@/components/',
    )
    if (rewritten !== source) {
      fs.writeFileSync(file, rewritten)
      console.log(`[vercel-build] rewrote root imports in app/${rel}`)
    }
  }
}

function ensureRootNextSurface() {
  const marker = path.join(rootApp, 'ai-studio')
  const middlewareProxyConflict =
    fs.existsSync(rootMiddleware) && fs.existsSync(rootProxy)
  const hasLegacyConfig =
    fs.existsSync(legacyNextConfigJs) || fs.existsSync(legacyNextConfigCjs)
  const alreadyReady =
    fs.existsSync(rootConfig) &&
    fs.existsSync(marker) &&
    !middlewareProxyConflict &&
    !hasLegacyConfig

  if (alreadyReady) {
    console.log('[vercel-build] root Next surface already present')
    rewriteRootComponentImports()
    return
  }

  if (!fs.existsSync(dashApp)) {
    console.error(`[vercel-build] missing apps/dashboard/app at ${dashApp}`)
    process.exit(1)
  }

  console.log('[vercel-build] preparing root Next surface from apps/dashboard')
  fs.rmSync(rootApp, { recursive: true, force: true })
  fs.cpSync(dashApp, rootApp, { recursive: true })

  if (fs.existsSync(dashPublic)) {
    fs.mkdirSync(rootPublic, { recursive: true })
    fs.cpSync(dashPublic, rootPublic, { recursive: true })
  }

  // Next.js 16 rejects having both middleware.ts and proxy.ts.
  // Prefer existing root proxy.ts; only copy dashboard middleware when no proxy exists.
  if (fs.existsSync(rootProxy)) {
    if (fs.existsSync(rootMiddleware)) {
      fs.rmSync(rootMiddleware, { force: true })
    }
    console.log('[vercel-build] keeping root proxy.ts; skipped middleware.ts')
  } else if (fs.existsSync(dashMiddleware)) {
    fs.copyFileSync(dashMiddleware, rootMiddleware)
    console.log('[vercel-build] copied apps/dashboard/middleware.ts → middleware.ts')
  }

  // Prefer next.config.mjs; retire legacy root next.config.js/cjs so Next does not load both.
  for (const legacy of [legacyNextConfigJs, legacyNextConfigCjs]) {
    if (!fs.existsSync(legacy)) continue
    const bak = `${legacy}.vercel-bak`
    fs.renameSync(legacy, bak)
    console.log(`[vercel-build] renamed ${path.basename(legacy)} → ${path.basename(bak)}`)
  }

  fs.writeFileSync(
    rootConfig,
    "export { default } from './apps/dashboard/next.config.mjs'\n",
  )
  rewriteRootComponentImports()
  console.log('[vercel-build] wrote next.config.mjs and flattened app/')
}

ensureRootNextSurface()

if (!fs.existsSync(rootApp)) {
  console.error(`[vercel-build] missing root app/ at ${rootApp}`)
  process.exit(1)
}
if (!fs.existsSync(rootConfig)) {
  console.error(`[vercel-build] missing root next.config.mjs at ${rootConfig}`)
  process.exit(1)
}

const preferred = String(process.env.NEXT_BUILD_PREFERRED_MODE || 'turbopack').toLowerCase()
const modeFlag = preferred === 'webpack' ? '--webpack' : '--turbopack'
const nextBin = require.resolve('next/dist/bin/next', { paths: [monorepoRoot, appRoot] })

console.log(`[vercel-build] building at monorepo root: next build ${modeFlag}`)
const result = spawnSync(process.execPath, [nextBin, 'build', modeFlag], {
  stdio: 'inherit',
  cwd: monorepoRoot,
  env: process.env,
})

if ((result.status ?? 1) !== 0) {
  console.error(`[vercel-build] next build failed with status ${result.status}`)
  process.exit(result.status ?? 1)
}

const rootNext = path.join(monorepoRoot, process.env.NEXT_BUILD_DIST_DIR || '.next')
if (!fs.existsSync(rootNext)) {
  console.error(`[vercel-build] missing build output: ${rootNext}`)
  process.exit(1)
}

console.log(`[vercel-build] ok: ${rootNext}`)
process.exit(0)
