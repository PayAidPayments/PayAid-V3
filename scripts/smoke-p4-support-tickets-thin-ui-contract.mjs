/**
 * Offline contract smoke for P4 Support tickets thin UI.
 * Run: node scripts/smoke-p4-support-tickets-thin-ui-contract.mjs
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
    console.log(`OK ${name}`)
  } catch (err) {
    failures.push({ name, error: String(err?.message || err) })
    console.log(`FAIL ${name}: ${err?.message || err}`)
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

check('components/support/P4SupportTicketRequestsPanel.tsx', () => {
  assert.ok(fs.existsSync(path.join(root, 'components/support/P4SupportTicketRequestsPanel.tsx')))
})
check('apps/dashboard/app/dashboard/support/tickets/requests/page.tsx', () => {
  assert.ok(
    fs.existsSync(path.join(root, 'apps/dashboard/app/dashboard/support/tickets/requests/page.tsx'))
  )
})
check('app/dashboard/support/tickets/requests/page.tsx', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/dashboard/support/tickets/requests/page.tsx')))
})
check('apps/dashboard/app/api/support/tickets/slice/route.ts', () => {
  assert.ok(fs.existsSync(path.join(root, 'apps/dashboard/app/api/support/tickets/slice/route.ts')))
})

const panel = read('components/support/P4SupportTicketRequestsPanel.tsx')
check('panel: calls slice API', () => {
  assert.match(panel, /\/api\/support\/tickets\/slice/)
})
check('panel: status action', () => {
  assert.match(panel, /action:\s*'status'/)
})
check('panel: new status', () => {
  assert.match(panel, /'new'/)
})
check('panel: scope note', () => {
  assert.match(panel, /No live send/)
})
check('panel: auth headers', () => {
  assert.match(panel, /getAuthHeaders/)
})
check('panel avoids demo hub /api/support/tickets list', () => {
  assert.doesNotMatch(panel, /fetch\('\/api\/support\/tickets'/)
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}
console.log('PASS: p4 support thin UI contract')
