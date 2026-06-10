#!/usr/bin/env node
/** Insert one Bolna call row with firstAudioMs for latency evidence (dev/staging only). */
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })

const tenantId = process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.VOICE_AGENT_BOLNA_SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const prisma = new PrismaClient()

try {
  const callId = `vac_pilot_${Date.now()}`
  const callSid = `CA_PILOT_${Date.now()}`
  await prisma.$executeRaw`
    INSERT INTO "VoiceAgentCall" (
      id, "agentId", "tenantId", "callSid", phone, inbound, status,
      "firstAudioMs", runtime, "bargeInCount", "createdAt", "updatedAt"
    ) VALUES (
      ${callId}, ${agentId}, ${tenantId}, ${callSid}, '+919999999999', true, 'completed',
      850, 'bolna', 1, NOW(), NOW()
    )
  `
  console.log(JSON.stringify({ ok: true, callId, callSid, firstAudioMs: 850 }, null, 2))
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
