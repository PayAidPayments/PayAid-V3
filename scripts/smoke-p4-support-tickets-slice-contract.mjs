/**
 * Offline contract smoke for P4 Support tickets thin slice.
 * Run: node scripts/smoke-p4-support-tickets-slice-contract.mjs
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

check('slice route exists (dashboard)', () => {
  assert.ok(fs.existsSync(path.join(root, 'apps/dashboard/app/api/support/tickets/slice/route.ts')))
})

check('slice route exists (root app)', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/api/support/tickets/slice/route.ts')))
})

check('slim-safe + product status mapping', () => {
  const src = read('apps/dashboard/app/api/support/tickets/slice/route.ts')
  assert.doesNotMatch(src, /@\/lib\/events/)
  assert.match(src, /p4-support-tickets-smallest/)
  assert.match(src, /new:\s*\['open',\s*'closed'\]/)
  assert.match(src, /open:\s*\['resolved',\s*'closed'\]/)
  assert.doesNotMatch(src, /WAHA|WATI|generate-payment-link|@\/lib\/events\/taxonomy/i)
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scope: 'p4-support-tickets-slice-contract' }))
