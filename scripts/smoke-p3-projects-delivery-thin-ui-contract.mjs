#!/usr/bin/env node
/**
 * Contract: P3 Projects thin operator UI wires to /api/projects/slice only.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'components/projects/P3ProjectRequestsPanel.tsx',
  'apps/dashboard/app/dashboard/projects/requests/page.tsx',
  'apps/dashboard/app/dashboard/projects/delivery/page.tsx',
  'apps/dashboard/app/api/projects/slice/route.ts',
]

let failed = false
for (const rel of required) {
  const full = path.join(root, rel)
  if (!existsSync(full)) {
    console.error(`MISSING ${rel}`)
    failed = true
    continue
  }
  console.log(`OK ${rel}`)
}

const panel = readFileSync(path.join(root, 'components/projects/P3ProjectRequestsPanel.tsx'), 'utf8')
const checks = [
  [/\/api\/projects\/slice/, 'calls slice API'],
  [/action:\s*['"]status['"]|action:\s*'status'/, 'status action'],
  [/planning/, 'planning status'],
  [/No Gantt/, 'scope note'],
  [/getAuthHeaders/, 'auth headers'],
]

for (const [re, label] of checks) {
  if (!re.test(panel)) {
    console.error(`FAIL panel: ${label}`)
    failed = true
  } else {
    console.log(`OK panel: ${label}`)
  }
}

const apiHits = [...panel.matchAll(/\/api\/projects(?:\/slice)?(?![A-Za-z0-9_-])/g)].map((m) => m[0])
if (apiHits.length === 0 || apiHits.some((h) => h !== '/api/projects/slice')) {
  console.error('FAIL panel must only call /api/projects/slice, got:', apiHits)
  failed = true
} else {
  console.log('OK panel avoids broken hub /api/projects list')
}

if (failed) process.exit(1)
console.log('PASS: p3 projects thin UI contract')
