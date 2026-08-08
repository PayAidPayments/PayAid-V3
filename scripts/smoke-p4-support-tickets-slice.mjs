/**
 * P4 Support tickets thin-slice smoke (DB via pg).
 * new → open → resolved|closed; optional contactId.
 *
 * Run: npm run smoke:p4-support-tickets-slice
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
    finance: 'closed',
    projects: 'closed',
    appointments: 'frozen',
    voiceStage4: 'frozen',
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
  },
  steps: {},
}

function fail(step, err) {
  out.steps[step] = { ok: false, error: String(err?.message || err) }
  throw err
}

if (!databaseUrl) {
  out.error = 'DATABASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 20000,
  statement_timeout: 30000,
})

try {
  await client.connect()

  const contactId = `p4sptc_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const ticketId = `p4sptt_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const cancelId = `p4sptx_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const ticketNumber = `TKT-P4-${Date.now().toString().slice(-6)}`
  const cancelNumber = `TKT-P4C-${Date.now().toString().slice(-6)}`
  const email = `p4-support-smoke-${Date.now()}@example.com`
  const name = `P4 Support Smoke ${stamp.slice(0, 19)}`

  await client.query(
    `INSERT INTO "Contact" (id, name, email, source, tags, stage, status, "leadScore", "scoreUpdatedAt", "createdAt", "tenantId")
     VALUES ($1,$2,$3,'support_tickets_slice','{}','customer','active',0,NOW(),NOW(),$4)`,
    [contactId, name, email, tenantId]
  )
  out.steps.createContact = { ok: true, contactId }

  await client.query(
    `INSERT INTO "SupportCase" (
       id, "tenantId", "ticketNumber", subject, description, "contactId", status, priority, channel,
       "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,$3,$4,'P4 support tickets smoke',$5,'new','medium','web', NOW(), NOW()
     )`,
    [ticketId, tenantId, ticketNumber, name, contactId]
  )
  out.steps.createTicket = { ok: true, ticketId, ticketNumber, status: 'new', contactId }

  const listed = await client.query(
    `SELECT id, status, "contactId" FROM "SupportCase" WHERE id = $1 AND "tenantId" = $2`,
    [ticketId, tenantId]
  )
  out.steps.list = {
    ok: listed.rowCount === 1 && listed.rows[0].status === 'new',
    status: listed.rows[0]?.status,
  }
  if (!out.steps.list.ok) fail('list', new Error('created ticket not listed'))

  await client.query(`UPDATE "SupportCase" SET status = 'open', "updatedAt" = NOW() WHERE id = $1`, [
    ticketId,
  ])
  const opened = await client.query(`SELECT status FROM "SupportCase" WHERE id = $1`, [ticketId])
  out.steps.open = { ok: opened.rows[0]?.status === 'open', status: opened.rows[0]?.status }
  if (!out.steps.open.ok) fail('open', new Error('open transition failed'))

  await client.query(
    `UPDATE "SupportCase" SET status = 'resolved', "updatedAt" = NOW() WHERE id = $1`,
    [ticketId]
  )
  const resolved = await client.query(`SELECT status FROM "SupportCase" WHERE id = $1`, [ticketId])
  out.steps.resolve = {
    ok: resolved.rows[0]?.status === 'resolved',
    status: resolved.rows[0]?.status,
  }
  if (!out.steps.resolve.ok) fail('resolve', new Error('resolve transition failed'))

  await client.query(
    `INSERT INTO "SupportCase" (
       id, "tenantId", "ticketNumber", subject, description, status, priority, channel,
       "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,$3,'P4 Support Cancel Smoke','cancel path','new','medium','web', NOW(), NOW()
     )`,
    [cancelId, tenantId, cancelNumber]
  )
  await client.query(`UPDATE "SupportCase" SET status = 'closed', "updatedAt" = NOW() WHERE id = $1`, [
    cancelId,
  ])
  const closed = await client.query(`SELECT status FROM "SupportCase" WHERE id = $1`, [cancelId])
  out.steps.close = {
    ok: closed.rows[0]?.status === 'closed',
    ticketId: cancelId,
    status: closed.rows[0]?.status,
  }
  if (!out.steps.close.ok) fail('close', new Error('close transition failed'))

  out.ok = true
} catch (err) {
  out.error = String(err?.message || err)
} finally {
  try {
    await client.end()
  } catch {
    // ignore
  }
}

const dir = path.join(process.cwd(), 'docs/evidence/support')
mkdirSync(dir, { recursive: true })
const evidencePath = path.join(dir, `${stamp}-p4-support-tickets-slice-db-smoke.md`)
writeFileSync(
  evidencePath,
  `# P4 Support tickets slice — DB smoke\n\n- timestamp: ${iso}\n- tenantId: ${tenantId}\n- ok: ${out.ok}\n\n\`\`\`json\n${JSON.stringify(out, null, 2)}\n\`\`\`\n`
)
out.evidencePath = evidencePath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
