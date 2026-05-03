#!/usr/bin/env node
/**
 * Pre-deploy checks for apps/dashboard:
 * 1) Static `from "@/lib/..."` imports resolve to paths tracked under lib/ (Vercel clone).
 * 2) app/api ... /route.ts files export handlers (empty files break TS "is not a module").
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dashboard = path.join(root, 'apps', 'dashboard')

function walk(dir, files = []) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const ent of entries) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (/\.(tsx?)$/.test(ent.name)) files.push(p)
  }
  return files
}

const tracked = new Set(
  execSync('git ls-files -- lib/', {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .trim()
    .split('\n')
    .filter(Boolean)
)

const importRe = /\bfrom\s+['"](@\/lib\/[^'"]+)['"]/g

const missing = []
for (const file of walk(dashboard)) {
  const content = fs.readFileSync(file, 'utf8')
  importRe.lastIndex = 0
  let m
  while ((m = importRe.exec(content)) !== null) {
    const spec = m[1]
    const rel = spec.replace(/^@\//, '').replace(/\\/g, '/')
    const candidates = [
      rel + '.ts',
      rel + '.tsx',
      rel + '/index.ts',
      rel + '/index.tsx',
    ]
    const ok = candidates.some((c) => tracked.has(c))
    if (!ok) {
      missing.push({
        importedIn: path.relative(root, file).replace(/\\/g, '/'),
        spec,
        expectedOneOf: candidates,
      })
    }
  }
}

if (missing.length) {
  console.error('These @/lib imports do not resolve to files tracked in git:\n')
  for (const x of missing) {
    console.error(JSON.stringify(x, null, 2))
    console.error('')
  }
  process.exit(1)
}

const apiRoot = path.join(dashboard, 'app', 'api')
const emptyRoutes = []
function walkApiRoutes(dir) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkApiRoutes(p)
    else if (ent.name === 'route.ts') {
      const raw = fs.readFileSync(p, 'utf8')
      if (!/\bexport\b/.test(raw)) {
        emptyRoutes.push(path.relative(root, p).replace(/\\/g, '/'))
      }
    }
  }
}
walkApiRoutes(apiRoot)

if (emptyRoutes.length) {
  console.error('These API route files must export at least one handler (GET/POST/etc.):\n')
  for (const p of emptyRoutes) console.error('  - ' + p)
  process.exit(1)
}

const appRoot = path.join(dashboard, 'app')
const badLayoutsPages = []
function walkLayoutsPages(dir) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'api') continue
      walkLayoutsPages(p)
    } else if (ent.name === 'layout.tsx' || ent.name === 'page.tsx') {
      const raw = fs.readFileSync(p, 'utf8')
      const hasDefault =
        /\bexport\s+default\b/.test(raw) || /\bexport\s*\{\s*default\b/.test(raw)
      if (!hasDefault) {
        badLayoutsPages.push(path.relative(root, p).replace(/\\/g, '/'))
      }
    }
  }
}
walkLayoutsPages(appRoot)

if (badLayoutsPages.length) {
  console.error('These app layout.tsx / page.tsx files must default-export a component:\n')
  for (const p of badLayoutsPages) console.error('  - ' + p)
  process.exit(1)
}

console.log('OK: @/lib imports tracked; API routes export handlers; app layout/page default exports OK.')
