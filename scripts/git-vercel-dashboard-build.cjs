#!/usr/bin/env node
/**
 * Git-based Vercel entry: flatten apps/dashboard into monorepo root, then build.
 * Used when deploying from GitHub (no CLI staging workdir).
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()

function cp(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`[git-vercel-build] missing ${src}`)
    process.exit(1)
  }
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log(`[git-vercel-build] copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`)
}

const dashApp = path.join(root, 'apps/dashboard/app')
const rootApp = path.join(root, 'app')
cp(dashApp, rootApp)
// Prevent Next from compiling both root/app and apps/dashboard/app (broken @/ aliases).
fs.rmSync(dashApp, { recursive: true, force: true })
console.log('[git-vercel-build] removed apps/dashboard/app after flatten')

// Moving apps/dashboard/app -> root/app changes relative depth for legacy imports.
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
      console.log(`[git-vercel-build] rewrote-root-imports ${path.relative(root, full)}`)
    }
  }
}
rewriteDeepComponentImports(rootApp)

const dashPublic = path.join(root, 'apps/dashboard/public')
const rootPublic = path.join(root, 'public')
if (fs.existsSync(dashPublic)) {
  fs.mkdirSync(rootPublic, { recursive: true })
  fs.cpSync(dashPublic, rootPublic, { recursive: true })
  console.log('[git-vercel-build] merged apps/dashboard/public -> public')
}
const mw = path.join(root, 'apps/dashboard/middleware.ts')
if (fs.existsSync(mw)) {
  fs.copyFileSync(mw, path.join(root, 'middleware.ts'))
  console.log('[git-vercel-build] copied middleware.ts')
}
// Next 16 rejects having both middleware.ts and proxy.ts at the project root.
const proxyPath = path.join(root, 'proxy.ts')
if (fs.existsSync(path.join(root, 'middleware.ts')) && fs.existsSync(proxyPath)) {
  fs.rmSync(proxyPath, { force: true })
  console.log('[git-vercel-build] removed root proxy.ts (middleware.ts wins for Voice SSO)')
}
fs.writeFileSync(path.join(root, 'next.config.mjs'), "export { default } from './apps/dashboard/next.config.mjs'\n")

const buildEnv = {
  ...process.env,
  PAYAID_ALLOW_TS_BUILD_ERRORS: '1',
  // Force webpack: turbopack fails on flattened monorepo + bull edge traces.
  NEXT_BUILD_PREFERRED_MODE: 'webpack',
  VERCEL_ALLOW_WEBPACK_FALLBACK: '1',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=6144',
}

console.log('[git-vercel-build] invoking vercel-build with NEXT_BUILD_PREFERRED_MODE=webpack')
const result = spawnSync(process.execPath, [path.join(root, 'apps/dashboard/scripts/vercel-build.cjs')], {
  cwd: root,
  stdio: 'inherit',
  env: buildEnv,
})
process.exit(result.status === 0 ? 0 : result.status ?? 1)
