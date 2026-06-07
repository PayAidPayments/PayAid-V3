#!/usr/bin/env npx tsx
import dotenv from 'dotenv'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { enqueueWebsiteLeadCall } from '../../lib/voice-agent/triggers/website-lead-trigger'
import { pickupNextCampaignContact } from '../../lib/voice-agent/campaign-dialer'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

async function main() {
  const prisma = new PrismaClient()
  const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
  const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'

  try {
    const queued = await enqueueWebsiteLeadCall(prisma, {
      tenantId,
      agentId,
      phone: `9${String(Date.now()).slice(-9)}`,
      name: 'Dialer Direct',
      formId: 'dialer-direct',
    })

    await prisma.voiceAgentCampaign.update({
      where: { id: queued.campaignId },
      data: { status: 'running', startedAt: new Date() },
    })

    const result = await pickupNextCampaignContact(prisma, {
      tenantId,
      campaignId: queued.campaignId,
    })

    const ok = result.status === 'dialed'
    console.log(JSON.stringify({ ok, mode: 'direct', campaignId: queued.campaignId, result }))
    process.exit(ok ? 0 : 1)
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

void main()
