#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const prisma = new PrismaClient()
const timeout = setTimeout(() => {
  console.log(JSON.stringify({ ok: false, error: 'timeout_15s' }))
  process.exit(2)
}, 15_000)

try {
  const agent = await prisma.voiceAgent.findFirst({ take: 1, select: { id: true } })
  const delegates = {
    voiceAgent: !!prisma.voiceAgent,
    voiceDemoSession: !!prisma.voiceDemoSession,
    voiceAgentTrainingPack: !!prisma.voiceAgentTrainingPack,
  }
  clearTimeout(timeout)
  console.log(JSON.stringify({ ok: true, dbReachable: true, sampleAgentId: agent?.id ?? null, delegates }))
} catch (e) {
  clearTimeout(timeout)
  console.log(
    JSON.stringify({
      ok: false,
      dbReachable: false,
      error: e instanceof Error ? e.message : String(e),
      delegates: {
        voiceAgent: !!prisma.voiceAgent,
        voiceDemoSession: !!prisma.voiceDemoSession,
        voiceAgentTrainingPack: !!prisma.voiceAgentTrainingPack,
      },
    }),
  )
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
