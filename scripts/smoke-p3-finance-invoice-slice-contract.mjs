/**
 * Offline contract smoke for P3 Finance invoice thin slice.
 * Run: node scripts/smoke-p3-finance-invoice-slice-contract.mjs
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
  assert.ok(fs.existsSync(path.join(root, 'apps/dashboard/app/api/finance/invoices/slice/route.ts')))
})

check('slice route exists (root app)', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/api/finance/invoices/slice/route.ts')))
})

check('slim-safe + product status mapping', () => {
  const src = read('apps/dashboard/app/api/finance/invoices/slice/route.ts')
  assert.doesNotMatch(src, /@\/lib\/events/)
  assert.match(src, /p3-finance-invoice-smallest/)
  assert.match(src, /issued:\s*'sent'/)
  assert.match(src, /paymentGateway:\s*false/)
  assert.doesNotMatch(src, /WAHA|WATI|generate-payment-link|send-reminder/i)
})

check('smoke scripts present', () => {
  assert.ok(fs.existsSync(path.join(root, 'scripts/smoke-p3-finance-invoice-slice.mjs')))
  assert.ok(fs.existsSync(path.join(root, 'scripts/smoke-p3-finance-invoice-slice-hosted.mjs')))
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scope: 'p3-finance-invoice-slice-contract' }))
