#!/usr/bin/env npx tsx
/**
 * Queue trigger contacts directly (no voice HTTP).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { enqueueWebsiteLeadCall } from '../../lib/voice-agent/triggers/website-lead-trigger'
import { enqueueCrmStageCall } from '../../lib/voice-agent/triggers/crm-stage-trigger'
import { enqueueMissedCallCallback } from '../../lib/voice-agent/triggers/missed-call-trigger'
import { enqueueMarketingLeadCall } from '../../lib/voice-agent/triggers/marketing-lead-trigger'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

async function main() {
  const prisma = new PrismaClient()
  const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
  const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
  const results: Array<{ name: string; ok: boolean }> = []

  try {
    const w = await enqueueWebsiteLeadCall(prisma, {
      tenantId,
      agentId,
      phone: `9${String(Date.now()).slice(-9)}`,
      name: 'Direct Smoke',
      formId: 'direct-smoke',
    })
    results.push({ name: 'website-lead', ok: w.status === 'queued' })

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

    const allOk = results.every((r) => r.ok)
    console.log(JSON.stringify({ ok: allOk, mode: 'direct', results }))
    process.exit(allOk ? 0 : 1)
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

void main()
