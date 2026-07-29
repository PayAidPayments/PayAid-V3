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

cp(path.join(root, 'apps/dashboard/app'), path.join(root, 'app'))
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
fs.writeFileSync(
  path.join(root, 'next.config.mjs'),
  "export { default } from './apps/dashboard/next.config.mjs'\n"
)

process.env.PAYAID_ALLOW_TS_BUILD_ERRORS = process.env.PAYAID_ALLOW_TS_BUILD_ERRORS || '1'
process.env.NEXT_BUILD_PREFERRED_MODE = process.env.NEXT_BUILD_PREFERRED_MODE || 'webpack'
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=6144'

const result = spawnSync(process.execPath, [path.join(root, 'apps/dashboard/scripts/vercel-build.cjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
process.exit(result.status === 0 ? 0 : result.status ?? 1)
