#!/usr/bin/env node
/**
 * Queue trigger contacts directly (no voice HTTP) — for local rehearsal when Next dev is slow.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const phone = `9${String(Date.now()).slice(-9)}`

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const { enqueueWebsiteLeadCall } = await import('../../lib/voice-agent/triggers/website-lead-trigger.ts')
const { enqueueCrmStageCall } = await import('../../lib/voice-agent/triggers/crm-stage-trigger.ts')
const { enqueueMissedCallCallback } = await import('../../lib/voice-agent/triggers/missed-call-trigger.ts')
const { enqueueMarketingLeadCall } = await import('../../lib/voice-agent/triggers/marketing-lead-trigger.ts')

const results = []
try {
  const w = await enqueueWebsiteLeadCall(prisma, {
    tenantId,
    agentId,
    phone,
    name: 'Direct Smoke',
    formId: 'direct-smoke',
  })
  results.push({ name: 'website-lead', ok: w.status === 'queued', campaignContactId: w.campaignContactId })

  const c = await enqueueCrmStageCall(prisma, {
    tenantId,
    agentId,
    phone: `9${String(Date.now() + 1).slice(-9)}`,
    stageTrigger: 'new_lead',
    name: 'Direct CRM',
  })
  results.push({ name: 'crm-stage', ok: c.status === 'queued' })

  const m = await enqueueMissedCallCallback(prisma, {
    tenantId,
    agentId,
    phone: `9${String(Date.now() + 2).slice(-9)}`,
    missedCallSid: 'CA_direct_smoke',
  })
  results.push({ name: 'missed-call', ok: m.status === 'queued' })

  const f = await enqueueMarketingLeadCall(prisma, {
    tenantId,
    agentId,
    phone: `9${String(Date.now() + 3).slice(-9)}`,
    source: 'facebook_lead',
    platformLeadId: 'fb_direct_1',
  })
  results.push({ name: 'marketing-facebook', ok: f.status === 'queued' })
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), results }))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}

const allOk = results.every((r) => r.ok)
console.log(JSON.stringify({ ok: allOk, mode: 'direct', results }))
process.exit(allOk ? 0 : 1)
