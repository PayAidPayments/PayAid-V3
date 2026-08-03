/**
 * Offline contract smoke for P2 Appointments thin UI (no calendar / no live send).
 * Run: node scripts/smoke-p2-appointments-thin-ui-contract.mjs
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
  assert.ok(fs.existsSync(path.join(root, 'apps/dashboard/app/dashboard/appointments/requests/page.tsx')))
})

check('requests page exists (root app)', () => {
  assert.ok(fs.existsSync(path.join(root, 'app/dashboard/appointments/requests/page.tsx')))
})

check('panel uses slice API only', () => {
  const src = read('components/appointments/P2AppointmentRequestsPanel.tsx')
  assert.match(src, /\/api\/appointments\/slice/)
  assert.doesNotMatch(src, /CalendarView/)
  assert.doesNotMatch(src, /WAHA|WATI|sendReminder|send\(/i)
})

check('CRM contact card uses contact appointments + slice status', () => {
  const src = read('components/crm/contact/ContactAppointmentsCard.tsx')
  assert.match(src, /\/api\/crm\/contacts\/\$\{contactId\}\/appointments/)
  assert.match(src, /\/api\/appointments\/slice/)
  assert.doesNotMatch(src, /CalendarView/)
})

check('CRM contact detail wires ContactAppointmentsCard', () => {
  const src = read('apps/crm/app/crm/[tenantId]/Contacts/[id]/page.tsx')
  assert.match(src, /ContactAppointmentsCard/)
})

check('CRM mirrors slim-safe appointment routes', () => {
  assert.ok(fs.existsSync(path.join(root, 'apps/crm/app/api/appointments/slice/route.ts')))
  assert.ok(fs.existsSync(path.join(root, 'apps/crm/app/api/crm/contacts/[id]/appointments/route.ts')))
  const slice = read('apps/crm/app/api/appointments/slice/route.ts')
  assert.doesNotMatch(slice, /@\/lib\/events/)
  assert.match(slice, /PENDING/)
})

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scope: 'p2-appointments-thin-ui-contract' }))
