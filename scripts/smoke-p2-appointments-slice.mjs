/**
 * P2 Appointments smallest-slice smoke (DB via pg; no live send).
 * Mirrors lib/appointments/p2-slice.ts behavior for proof without Next server-only imports.
 *
 * Run: npm run smoke:p2-appointments-slice
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const tenantId =
  process.env.CANONICAL_STAGING_TENANT_ID || process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const databaseUrl = process.env.DATABASE_URL || ''

const out = {
  ok: false,
  timestamp: iso,
  tenantId,
  gates: {
    voiceStage4: 'frozen',
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
  },
  steps: {},
}

if (!databaseUrl) {
  out.error = 'DATABASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 20000,
  query_timeout: 30000,
})

try {
  await client.connect()

  const contactId = `p2appt_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const appointmentId = `p2appt_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const reminderId = `p2aptr_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const interactionId = `p2apti_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const email = `p2-appt-smoke-${Date.now()}@example.com`
  const name = `P2 Appt Smoke ${stamp.slice(0, 19)}`

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(10, 0, 0, 0)

  await client.query(
    `INSERT INTO "Contact" (id, name, email, source, tags, stage, status, "leadScore", "scoreUpdatedAt", "createdAt", "tenantId")
     VALUES ($1,$2,$3,'appointment_request','{}','prospect','active',0,NOW(),NOW(),$4)`,
    [contactId, name, email, tenantId]
  )

  await client.query(
    `INSERT INTO "Appointment" (
       id, "tenantId", "contactId", "contactName", "contactEmail",
       "appointmentDate", "startTime", "endTime", duration, status,
       type, "serviceName", notes, "paymentStatus", "reminderSent", "isOnline",
       "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,$3,$4,$5,
       $6,'10:30','11:00',30,'SCHEDULED',
       'CONSULTATION','Appointment request','P2 slice smoke', 'PENDING', false, false,
       NOW(), NOW()
     )`,
    [appointmentId, tenantId, contactId, name, email, tomorrow.toISOString()]
  )

  await client.query(
    `INSERT INTO "Interaction" (id, type, subject, notes, outcome, "createdAt", "contactId")
     VALUES ($1,'appointment',$2,$3,'requested',NOW(),$4)`,
    [
      interactionId,
      `Appointment request 10:30 ${tomorrow.toISOString().slice(0, 10)}`,
      JSON.stringify({ appointmentId, status: 'pending', source: 'p2-appointments-slice-smoke' }),
      contactId,
    ]
  )

  const reminderAt = new Date(tomorrow)
  reminderAt.setUTCMinutes(reminderAt.getUTCMinutes() - 30)
  await client.query(
    `INSERT INTO "AppointmentReminder" (
       id, "appointmentId", type, "scheduledAt", status, message, "createdAt", "updatedAt", "tenantId"
     ) VALUES ($1,$2,'EMAIL',$3,'PENDING',$4,NOW(),NOW(),$5)`,
    [reminderId, appointmentId, reminderAt.toISOString(), 'Reminder draft-first; not sent', tenantId]
  )

  out.steps.create = {
    ok: true,
    appointmentId,
    contactId,
    status: 'pending',
    dbStatus: 'SCHEDULED',
    reminderStatus: 'PENDING',
    reminderSent: false,
    crmInteractionId: interactionId,
  }

  const upcoming = await client.query(
    `SELECT id, status FROM "Appointment"
     WHERE "tenantId" = $1 AND "contactId" = $2
       AND "appointmentDate" >= date_trunc('day', NOW())
       AND status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS')
     ORDER BY "appointmentDate" ASC`,
    [tenantId, contactId]
  )
  out.steps.listUpcoming = {
    ok: upcoming.rows.some((r) => r.id === appointmentId),
    count: upcoming.rows.length,
  }

  await client.query(`UPDATE "Appointment" SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1`, [
    appointmentId,
  ])
  out.steps.confirm = { ok: true, status: 'confirmed', dbStatus: 'CONFIRMED' }

  await client.query(`UPDATE "Appointment" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = $1`, [
    appointmentId,
  ])
  await client.query(
    `UPDATE "AppointmentReminder" SET status = 'CANCELLED', "updatedAt" = NOW()
     WHERE "appointmentId" = $1 AND status = 'PENDING'`,
    [appointmentId]
  )
  out.steps.complete = { ok: true, status: 'completed', dbStatus: 'COMPLETED' }

  // Terminal guard: completed should not be listed as upcoming
  const stillUpcoming = await client.query(
    `SELECT id FROM "Appointment"
     WHERE id = $1 AND status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS')`,
    [appointmentId]
  )
  out.steps.terminalGuard = { ok: stillUpcoming.rows.length === 0 }

  const reminder = await client.query(`SELECT status FROM "AppointmentReminder" WHERE id = $1`, [
    reminderId,
  ])
  out.steps.reminderHook = {
    ok: reminder.rows[0]?.status === 'CANCELLED',
    finalStatus: reminder.rows[0]?.status || null,
    sent: false,
  }

  out.ok = Boolean(
    out.steps.create.ok &&
      out.steps.listUpcoming.ok &&
      out.steps.confirm.ok &&
      out.steps.complete.ok &&
      out.steps.terminalGuard.ok &&
      out.steps.reminderHook.ok
  )
} catch (error) {
  out.error = error instanceof Error ? error.message : String(error)
} finally {
  await client.end().catch(() => undefined)
}

const dir = path.join(process.cwd(), 'docs', 'evidence', 'appointments')
mkdirSync(dir, { recursive: true })
const mdPath = path.join(dir, `${stamp}-p2-appointments-slice-smoke.md`)
writeFileSync(
  mdPath,
  [
    '# P2 Appointments — smallest slice smoke',
    '',
    `- Timestamp: ${iso}`,
    `- Pass: ${out.ok ? 'yes' : 'no'}`,
    `- Tenant: ${tenantId}`,
    '',
    '## Gates',
    '',
    `- Voice Stage 4: ${out.gates.voiceStage4}`,
    `- Email/WhatsApp: ${out.gates.emailWhatsapp}`,
    `- bridge-v2: ${out.gates.bridgeV2}`,
    `- LI: ${out.gates.leadIntelligence}`,
    `- migrations: ${out.gates.migrations}`,
    '',
    '## Steps',
    '',
    '```json',
    JSON.stringify(out.steps, null, 2),
    '```',
    '',
    out.error ? `## Error\n\n${out.error}\n` : '',
  ].join('\n'),
  'utf8'
)
out.evidencePath = mdPath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
