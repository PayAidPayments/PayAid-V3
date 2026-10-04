#!/usr/bin/env node
/**
 * Offline preflight for git-vercel-dashboard-build.cjs (no full next build).
 * Exit 1 if required files are missing from the git tree or stub assets are absent.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ref = process.argv[2] || 'HEAD'
let failed = false

function inGit(rel) {
  try {
    execSync(`git cat-file -e ${ref}:${rel.replace(/\\/g, '/')}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function mustExistGit(rel, why) {
  if (!inGit(rel)) {
    console.error(`MISSING_IN_GIT ${rel} (${why})`)
    failed = true
  } else {
    console.log(`ok_git ${rel}`)
  }
}

function mustExistDisk(rel, why) {
  if (!existsSync(path.join(root, rel))) {
    console.error(`MISSING_ON_DISK ${rel} (${why})`)
    failed = true
  } else {
    console.log(`ok_disk ${rel}`)
  }
}

const required = [
  ['scripts/git-vercel-dashboard-build.cjs', 'build entry'],
  ['scripts/stubs/bull-noop.cjs', 'bull package stub'],
  ['scripts/stubs/bull-queue-preview.ts', 'lib/queue/bull.ts stub'],
  ['lib/security/redact-sensitive.ts', 'ai audit/trace'],
  ['lib/security/ai-policy/wrap-ai-route.ts', 'customer-flow routes'],
  ['lib/automation/ui-client.ts', 'workflow-automation home'],
  ['lib/ai/platform/runtime/ai-runtime-runner.ts', 'wrapAiRoute runtime'],
  ['lib/ai/platform/runtime/schemas.ts', 'runtime schemas'],
  ['lib/ai/json-narrow.ts', 'wrapAiRoute helper'],
  ['apps/dashboard/app/api/ai/customer-flows/orchestrate/route.ts', 'phase4 API'],
  ['apps/dashboard/app/ai-studio', 'ai-studio app tree'],
]

for (const [rel, why] of required) mustExistGit(rel, why)

// Walk import graph from customer-flow routes + wrap-ai-route (relative + @/).
const seeds = [
  'lib/security/ai-policy/wrap-ai-route.ts',
  'lib/ai/platform/runtime/ai-runtime-runner.ts',
  'lib/automation/ui-client.ts',
  'apps/dashboard/app/api/ai/customer-flows/orchestrate/route.ts',
  'apps/dashboard/app/api/ai/customer-flows/sales-follow-up/route.ts',
  'apps/dashboard/app/api/ai/customer-flows/gst-invoice-draft/route.ts',
  'apps/dashboard/app/api/ai/customer-flows/drafts/route.ts',
  'apps/dashboard/app/api/ai/customer-flows/drafts/[draftId]/approve/route.ts',
]

const reAbs = /from\s+['"](@\/[^'"]+)['"]/g
const reRel = /from\s+['"](\.[^'"]+)['"]/g
const seen = new Set()
const missing = []

function resolveFrom(file, spec) {
  if (spec.startsWith('@/')) {
    const base = spec.slice(2)
    for (const c of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}.js`]) {
      if (existsSync(path.join(root, c))) return c.replace(/\\/g, '/')
    }
    return null
  }
  if (spec.startsWith('.')) {
    const base = path.normalize(path.join(path.dirname(file), spec)).replace(/\\/g, '/')
    for (const c of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}.js`, base]) {
      if (existsSync(path.join(root, c)) && statSync(path.join(root, c)).isFile()) {
        return c.replace(/\\/g, '/')
      }
    }
    return null
  }
  return null // package import
}

function walk(file) {
  const norm = file.replace(/\\/g, '/')
  if (seen.has(norm)) return
  seen.add(norm)
  const abs = path.join(root, norm)
  if (!existsSync(abs)) {
    missing.push(norm)
    return
  }
  if (!inGit(norm) && !norm.startsWith('apps/dashboard/app/')) {
    // dashboard app is flattened from apps/dashboard/app — must be in git
  }
  if (!inGit(norm)) {
    missing.push(`NOT_IN_GIT:${norm}`)
    return
  }
  const src = readFileSync(abs, 'utf8')
  for (const re of [reAbs, reRel]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) {
      const resolved = resolveFrom(norm, m[1])
      if (resolved) walk(resolved)
      else if (m[1].startsWith('@/') || m[1].startsWith('.')) {
        missing.push(`${norm} -> ${m[1]}`)
      }
    }
  }
}

for (const s of seeds) walk(s)

// Find bull package imports under lib/ (disk; should match git)
function walkDir(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue
    const full = path.join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walkDir(full, out)
    else if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

const bullImporters = []
for (const f of walkDir(path.join(root, 'lib/queue'))) {
  const src = readFileSync(f, 'utf8')
  if (/from\s+['"]bull['"]|require\(\s*['"]bull['"]\s*\)/.test(src)) {
    bullImporters.push(path.relative(root, f).replace(/\\/g, '/'))
  }
}

console.log('--- import_graph ---')
console.log(`touched=${seen.size}`)
if (missing.length) {
  console.error('MISSING_RESOLVES')
  for (const m of missing.slice(0, 80)) console.error(`  ${m}`)
  failed = true
} else {
  console.log('import_graph_ok')
}

console.log('--- bull_importers ---')
for (const b of bullImporters) console.log(b)
if (bullImporters.length && !bullImporters.every((b) => b === 'lib/queue/bull.ts' || true)) {
  console.log(`bull_importers_count=${bullImporters.length} (preview build must replace node_modules/bull)`)
}

// Simulate critical stub steps on a temp copy check: stub files readable
mustExistDisk('scripts/stubs/bull-noop.cjs', 'noop')
mustExistDisk('scripts/stubs/bull-queue-preview.ts', 'queue stub')

if (failed) {
  console.error('PREFLIGHT_FAIL')
  process.exit(1)
}
console.log('PREFLIGHT_OK')
process.exit(0)
