/**
 * In-process silent-failure watchdog for Bolna inbound streams (Phase 1 pilot).
 * Cleared when Bolna posts call_started to /runtime/bolna/events.
 */

import { prisma } from '@payaid/db'
import {
  BOLNA_FALLBACK_REASONS,
  VOICE_CALL_RUNTIME,
  VOICE_INBOUND_EVENTS,
  bolnaFallbackAuditEntry,
  logVoiceInbound,
} from './inbound-observability'

const SILENT_FAILURE_MS = 15_000
const armed = new Map<string, NodeJS.Timeout>()
const handshakeReceived = new Set<string>()

export function markBolnaCallStarted(callSid: string): void {
  handshakeReceived.add(callSid)
  clearBolnaSilentFailureWatchdog(callSid)
}

export function clearBolnaSilentFailureWatchdog(callSid: string): void {
  const t = armed.get(callSid)
  if (t) {
    clearTimeout(t)
    armed.delete(callSid)
  }
}

export function armBolnaSilentFailureWatchdog(callSid: string, tenantId?: string, agentId?: string): void {
  clearBolnaSilentFailureWatchdog(callSid)
  const timer = setTimeout(() => {
    void runSilentFailureCheck(callSid, tenantId, agentId)
  }, SILENT_FAILURE_MS)
  armed.set(callSid, timer)
}

async function runSilentFailureCheck(
  callSid: string,
  tenantId?: string,
  agentId?: string,
): Promise<void> {
  armed.delete(callSid)
  if (handshakeReceived.has(callSid)) {
    handshakeReceived.delete(callSid)
    return
  }

  const call = await prisma.voiceAgentCall.findFirst({
    where: { callSid, ...(tenantId ? { tenantId } : {}) },
    select: { id: true, runtime: true, status: true, metadata: { select: { actionsExecuted: true } } },
  })
  if (!call || call.runtime !== VOICE_CALL_RUNTIME.BOLNA) return
  if (call.status === 'completed' || call.status === 'failed') return

  const existing = (call.metadata?.actionsExecuted as unknown[]) || []
  const audit = bolnaFallbackAuditEntry(BOLNA_FALLBACK_REASONS.SILENT_NO_CALL_STARTED)

  await prisma.voiceAgentCall.update({
    where: { id: call.id },
    data: {
      runtime: VOICE_CALL_RUNTIME.BOLNA_STREAM_FAILED,
      status: 'failed',
      endTime: new Date(),
      metadata: {
        upsert: {
          create: { actionsExecuted: [audit] as any },
          update: { actionsExecuted: [...existing, audit] as any },
        },
      },
    },
  })

  logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_SILENT_FAILURE, {
    callSid,
    tenantId,
    agentId,
    runtime: VOICE_CALL_RUNTIME.BOLNA_STREAM_FAILED,
    reason: BOLNA_FALLBACK_REASONS.SILENT_NO_CALL_STARTED,
  })
}
