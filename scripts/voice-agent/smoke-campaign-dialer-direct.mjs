#!/usr/bin/env node
/**
 * Campaign dialer tick via lib (no voice HTTP).
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
const { pickupNextCampaignContact } = await import('../../lib/voice-agent/campaign-dialer.ts')

try {
  const queued = await enqueueWebsiteLeadCall(prisma, {
    tenantId,
    agentId,
    phone,
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
  console.log(
    JSON.stringify({
      ok,
      mode: 'direct',
      campaignId: queued.campaignId,
      result,
    }),
  )
  process.exit(ok ? 0 : 1)
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
