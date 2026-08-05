/**
 * Offline contract smoke for P3 Projects thin UI.
 * Run: node scripts/smoke-p3-projects-delivery-thin-ui-contract.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

function check(name, fn) {
  try {
    fn()
    console.log(`PASS  ${name}`)
  } catch (err) {
    failures.push({ name, error: String(err?.message || err) })
    console.log(`FAIL  ${name}: ${err?.message || err}`)
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

check('requests page exists (dashboard)', () => {
  assert.ok(fs.existsSync(path.join(root, 'apps/dashboard/app/dashboard/projects/requests/page.tsx')))
})

check('requests page exists (root app)', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/dashboard/projects/requests/page.tsx')))
})

check('panel uses slice API only', () => {
  const src = read('components/projects/P3ProjectRequestsPanel.tsx')
  assert.match(src, /\/api\/projects\/slice/)
  assert.doesNotMatch(src, /WAHA|WATI|Gantt|generate-payment-link/i)
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scope: 'p3-projects-delivery-thin-ui-contract' }))
