#!/usr/bin/env node
/**
 * Ensures every static `from "@/lib/..."` import in apps/dashboard resolves to a path
 * that exists in git (prevents Vercel "Can't resolve '@/lib/...'" when files were never committed).
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

console.log('OK: all static @/lib/* imports under apps/dashboard point to tracked files.')
