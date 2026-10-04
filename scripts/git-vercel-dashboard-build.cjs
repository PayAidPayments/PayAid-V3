#!/usr/bin/env node
/**
 * Git-based Vercel entry for payaid-v3 previews.
 * Flatten dashboard app → root, slim route surface, neutralize bull, then turbopack build.
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()

function log(msg) {
  console.log(`[git-vercel-build] ${msg}`)
}

function cp(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`[git-vercel-build] missing ${src}`)
    process.exit(1)
  }
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true })
  log(`copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`)
}

function rmIfExists(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) return false
  fs.rmSync(full, { recursive: true, force: true })
  log(`pruned ${rel}`)
  return true
}

function rewriteDeepComponentImports(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) {
      rewriteDeepComponentImports(full)
      continue
    }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue
    const source = fs.readFileSync(full, 'utf8')
    const rewritten = source.replace(/(['"])\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\//g, '$1@/components/')
    if (rewritten !== source) {
      fs.writeFileSync(full, rewritten)
      log(`rewrote-root-imports ${path.relative(root, full)}`)
    }
  }
}

function walkDirs(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    let st
    try {
      st = fs.statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      out.push(full)
      walkDirs(full, out)
    }
  }
  return out
}

// --- flatten ---
const dashApp = path.join(root, 'apps/dashboard/app')
const rootApp = path.join(root, 'app')
cp(dashApp, rootApp)
fs.rmSync(dashApp, { recursive: true, force: true })
log('removed apps/dashboard/app after flatten')
rewriteDeepComponentImports(rootApp)

const dashPublic = path.join(root, 'apps/dashboard/public')
const rootPublic = path.join(root, 'public')
if (fs.existsSync(dashPublic)) {
  fs.mkdirSync(rootPublic, { recursive: true })
  fs.cpSync(dashPublic, rootPublic, { recursive: true })
  log('merged apps/dashboard/public -> public')
}

const mw = path.join(root, 'apps/dashboard/middleware.ts')
if (fs.existsSync(mw)) {
  fs.copyFileSync(mw, path.join(root, 'middleware.ts'))
  log('copied middleware.ts')
}
const proxyPath = path.join(root, 'proxy.ts')
if (fs.existsSync(path.join(root, 'middleware.ts')) && fs.existsSync(proxyPath)) {
  fs.rmSync(proxyPath, { force: true })
  log('removed root proxy.ts (middleware.ts wins for Voice SSO)')
}

// Keep next.config simple — path aliases + drop bull/ioredis externals so stubs resolve.
fs.writeFileSync(
  path.join(root, 'next.config.mjs'),
  `import base from './apps/dashboard/next.config.mjs'

const serverExternalPackages = (base.serverExternalPackages || []).filter(
  (p) => p !== 'bull' && p !== 'ioredis'
)

/** @type {import('next').NextConfig} */
const config = {
  ...base,
  serverExternalPackages,
  turbopack: {
    ...(base.turbopack || {}),
    resolveAlias: {
      ...((base.turbopack && base.turbopack.resolveAlias) || {}),
      '@dashboard': './app',
      '@dashboard/*': './app/*',
      '@app': './app',
      '@app/*': './app/*',
      '@/*': './*',
    },
  },
}

export default config
`
)
log('wrote next.config.mjs for flattened preview')

const tsconfigPath = path.join(root, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  tsconfig.compilerOptions = tsconfig.compilerOptions || {}
  tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {}
  tsconfig.compilerOptions.paths['@dashboard/*'] = ['./app/*']
  tsconfig.compilerOptions.paths['@app/*'] = ['./app/*']
  fs.writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`)
  log('rewrote tsconfig paths @dashboard/* and @app/* -> ./app/*')
}

// Drop sibling workspaces / docs
for (const rel of [
  'apps/crm',
  'apps/hr',
  'apps/finance',
  'apps/leads',
  'apps/marketing',
  'apps/platform',
  'apps/projects',
  'apps/voice',
  'apps/inventory',
  '__tests__',
  'docs',
  '.tools',
  'archive',
  'uploads',
  'artifacts',
  'coverage',
  'playwright-report',
  'test-results',
]) {
  rmIfExists(rel)
}

// Slim app/ to specialist preview surface only (cuts compile graph on 8GB builders).
const keepAppFiles = new Set([
  'layout.tsx',
  'page.tsx',
  'globals.css',
  'ClientRoot.tsx',
  'providers.tsx',
  'ProvidersLoader.tsx',
  'PublicRumRoot.tsx',
  'ModuleShell.tsx',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'instrumentation-client.ts',
  'favicon.ico',
  'icon.png',
  'icon.ico',
  'apple-icon.png',
])
const keepAppDirs = new Set(['home', 'ai-studio', 'login', 'signup', 'register', 'forgot-password', 'api'])
for (const name of fs.readdirSync(rootApp)) {
  const full = path.join(rootApp, name)
  const st = fs.statSync(full)
  if (st.isDirectory()) {
    if (!keepAppDirs.has(name)) {
      fs.rmSync(full, { recursive: true, force: true })
      log(`pruned app/${name}`)
    }
  } else if (!keepAppFiles.has(name)) {
    fs.rmSync(full, { force: true })
    log(`pruned app/${name}`)
  }
}

const apiDir = path.join(rootApp, 'api')
if (fs.existsSync(apiDir)) {
  for (const name of fs.readdirSync(apiDir)) {
    if (name === 'ai' || name === 'auth') continue
    fs.rmSync(path.join(apiDir, name), { recursive: true, force: true })
    log(`pruned app/api/${name}`)
  }
  const apiAi = path.join(apiDir, 'ai')
  if (fs.existsSync(apiAi)) {
    for (const name of fs.readdirSync(apiAi)) {
      if (name === 'customer-flows') continue
      fs.rmSync(path.join(apiAi, name), { recursive: true, force: true })
      log(`pruned app/api/ai/${name}`)
    }
  }
}

// Stub instrumentation (no job auto-init)
fs.writeFileSync(
  path.join(root, 'instrumentation.ts'),
  `/** Git/Vercel preview stub — skips Bull job auto-init. */\n` +
    `export async function register() {\n` +
    `  if (process.env.NEXT_RUNTIME !== 'nodejs') return\n` +
    `  console.log('[instrumentation] git-vercel stub — background job auto-init skipped')\n` +
    `}\n`
)
log('stubbed instrumentation.ts')

// Replace queue modules that import bull (do not rely on package alias alone).
const queueStubs = [
  ['lib/queue/bull.ts', 'scripts/stubs/bull-queue-preview.ts'],
  ['lib/queue/email-queue.ts', 'scripts/stubs/email-queue-preview.ts'],
  ['lib/queue/whatsapp-queue.ts', 'scripts/stubs/whatsapp-queue-preview.ts'],
  ['lib/queue/model-training-queue.ts', 'scripts/stubs/model-training-queue-preview.ts'],
]
for (const [destRel, srcRel] of queueStubs) {
  const dest = path.join(root, destRel)
  const src = path.join(root, srcRel)
  if (!fs.existsSync(src)) {
    console.error(`[git-vercel-build] missing stub ${srcRel}`)
    process.exit(1)
  }
  if (fs.existsSync(dest)) {
    fs.copyFileSync(src, dest)
    log(`replaced ${destRel} with preview stub`)
  }
}

// Replace every installed bull package copy under node_modules.
const bullNoopSrc = path.join(root, 'scripts/stubs/bull-noop.cjs')
if (!fs.existsSync(bullNoopSrc)) {
  console.error('[git-vercel-build] missing scripts/stubs/bull-noop.cjs')
  process.exit(1)
}
const nm = path.join(root, 'node_modules')
let bullReplaced = 0
for (const dir of walkDirs(nm)) {
  if (path.basename(dir) !== 'bull') continue
  // only package roots that look like bull (have package.json name bull or bull folder under node_modules)
  const pkgJson = path.join(dir, 'package.json')
  let isBullPkg = false
  if (fs.existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'))
      isBullPkg = pkg.name === 'bull'
    } catch {
      isBullPkg = false
    }
  } else if (path.basename(path.dirname(dir)) === 'node_modules') {
    isBullPkg = true
  }
  if (!isBullPkg) continue
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify({ name: 'bull', version: '0.0.0-preview-stub', main: 'index.js' }, null, 2)}\n`
  )
  fs.copyFileSync(bullNoopSrc, path.join(dir, 'index.js'))
  bullReplaced += 1
  log(`replaced ${path.relative(root, dir)} with noop package`)
}
if (bullReplaced === 0) {
  // Ensure at least root node_modules/bull exists as stub (import may still resolve)
  const bullPkgDir = path.join(nm, 'bull')
  fs.rmSync(bullPkgDir, { recursive: true, force: true })
  fs.mkdirSync(bullPkgDir, { recursive: true })
  fs.writeFileSync(
    path.join(bullPkgDir, 'package.json'),
    `${JSON.stringify({ name: 'bull', version: '0.0.0-preview-stub', main: 'index.js' }, null, 2)}\n`
  )
  fs.copyFileSync(bullNoopSrc, path.join(bullPkgDir, 'index.js'))
  log('created root node_modules/bull noop package')
}

const masterJs = path.join(nm, 'bull', 'lib', 'process', 'master.js')
if (fs.existsSync(masterJs)) {
  console.error('[git-vercel-build] FATAL: bull master.js still present after stub — aborting')
  process.exit(1)
}
log('verified node_modules/bull has no lib/process/master.js')

// Required files for customer-flow routes
for (const rel of [
  'lib/security/redact-sensitive.ts',
  'lib/security/ai-policy/wrap-ai-route.ts',
  'lib/automation/ui-client.ts',
  'app/api/ai/customer-flows/orchestrate/route.ts',
  'app/ai-studio',
]) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`[git-vercel-build] FATAL: required path missing after slim: ${rel}`)
    process.exit(1)
  }
}
log('verified required specialist preview paths exist')

const buildEnv = {
  ...process.env,
  PAYAID_ALLOW_TS_BUILD_ERRORS: '1',
  PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS: '1',
  NEXT_BUILD_PREFERRED_MODE: 'turbopack',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=3072',
  NEXT_TELEMETRY_DISABLED: '1',
}

log('invoking vercel-build with NEXT_BUILD_PREFERRED_MODE=turbopack')
const result = spawnSync(process.execPath, [path.join(root, 'apps/dashboard/scripts/vercel-build.cjs')], {
  cwd: root,
  stdio: 'inherit',
  env: buildEnv,
})
process.exit(result.status === 0 ? 0 : result.status ?? 1)
