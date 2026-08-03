/**
 * Offline contract smoke for P3 Finance thin UI.
 * Run: node scripts/smoke-p3-finance-invoice-thin-ui-contract.mjs
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
  assert.ok(
    fs.existsSync(path.join(root, 'apps/dashboard/app/dashboard/finance/invoices/requests/page.tsx'))
  )
})

check('requests page exists (root app)', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/dashboard/finance/invoices/requests/page.tsx')))
})

check('panel uses slice API only', () => {
  const src = read('components/finance/P3InvoiceRequestsPanel.tsx')
  assert.match(src, /\/api\/finance\/invoices\/slice/)
  assert.doesNotMatch(src, /generate-payment-link|WAHA|WATI|send-reminder/i)
  assert.match(src, /mark paid|paid/)
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scope: 'p3-finance-invoice-thin-ui-contract' }))
