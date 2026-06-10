#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const prisma = new PrismaClient()

try {
  const agent = await prisma.voiceAgent.findFirst({
    where: { id: agentId, tenantId, status: 'active' },
    select: { id: true, name: true, language: true },
  })
  console.log(JSON.stringify({ ok: !!agent, agent }, null, 2))
  process.exit(agent ? 0 : 1)
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
