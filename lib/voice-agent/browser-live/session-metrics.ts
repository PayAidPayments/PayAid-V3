/**
 * Persist browser-live session metrics (barge-in, latency) on VoiceDemoSession.metadataJson.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import {
  markLastAssistantTurnInterrupted,
  parseTranscriptJson,
  type DemoTranscriptTurn,
} from '@/lib/voice-agent/demo-transcript'

export type BrowserLiveSessionMetrics = {
  bargeInCount?: number
  lastInterruptAt?: string
  lastInterruptMsToSilence?: number
  turnsCompleted?: number
  source?: string
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export function parseBrowserLiveMetrics(raw: unknown): BrowserLiveSessionMetrics {
  const m = readMeta(raw)
  return {
    bargeInCount: typeof m.bargeInCount === 'number' ? m.bargeInCount : 0,
    lastInterruptAt: typeof m.lastInterruptAt === 'string' ? m.lastInterruptAt : undefined,
    lastInterruptMsToSilence:
      typeof m.lastInterruptMsToSilence === 'number' ? m.lastInterruptMsToSilence : undefined,
    turnsCompleted: typeof m.turnsCompleted === 'number' ? m.turnsCompleted : 0,
    source: typeof m.source === 'string' ? m.source : undefined,
  }
}

export async function recordBrowserLiveBargeIn(
  prisma: PrismaClient,
  sessionId: string,
  meta?: { msToSilence?: number },
): Promise<number> {
  if (sessionId.startsWith('stub_')) return 0

  const row = await prisma.voiceDemoSession.findUnique({
    where: { id: sessionId },
    select: { metadataJson: true, transcriptJson: true },
  })
  if (!row) return 0

  const priorMeta = readMeta(row.metadataJson)
  const base = parseBrowserLiveMetrics(priorMeta)
  const bargeInCount = (base.bargeInCount ?? 0) + 1

  const transcript = markLastAssistantTurnInterrupted(parseTranscriptJson(row.transcriptJson))

  await prisma.voiceDemoSession.update({
    where: { id: sessionId },
    data: {
      transcriptJson: transcript as unknown as Prisma.InputJsonValue,
      metadataJson: toInputJsonValue({
        ...priorMeta,
        bargeInCount,
        lastInterruptAt: new Date().toISOString(),
        lastInterruptMsToSilence: meta?.msToSilence,
        turnsCompleted: base.turnsCompleted ?? 0,
        source: base.source || priorMeta.source || 'browser-live-ws',
      }),
    },
  })

  return bargeInCount
}

export async function incrementBrowserLiveTurnsCompleted(
  prisma: PrismaClient,
  sessionId: string,
): Promise<void> {
  if (sessionId.startsWith('stub_')) return

  const row = await prisma.voiceDemoSession.findUnique({
    where: { id: sessionId },
    select: { metadataJson: true },
  })
  if (!row) return

  const priorMeta = readMeta(row.metadataJson)
  const base = parseBrowserLiveMetrics(priorMeta)

  await prisma.voiceDemoSession.update({
    where: { id: sessionId },
    data: {
      metadataJson: toInputJsonValue({
        ...priorMeta,
        turnsCompleted: (base.turnsCompleted ?? 0) + 1,
        source: base.source || priorMeta.source || 'browser-live-ws',
      }),
    },
  })
}
