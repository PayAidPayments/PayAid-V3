/**
 * Twilio Connect Status Callback — Bolna stream lifecycle + silent-failure arm.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import {
  BOLNA_FALLBACK_REASONS,
  VOICE_CALL_RUNTIME,
  VOICE_INBOUND_EVENTS,
  bolnaFallbackAuditEntry,
  logVoiceInbound,
} from '@/lib/voice-agent/runtime/inbound-observability'
import {
  armBolnaSilentFailureWatchdog,
  clearBolnaSilentFailureWatchdog,
} from '@/lib/voice-agent/runtime/bolna-watchdog'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid')?.toString()
    const streamStatus = formData.get('StreamStatus')?.toString()

    if (!callSid) {
      return new NextResponse('OK', { status: 200 })
    }

    const call = await prisma.voiceAgentCall.findFirst({
      where: { callSid },
      select: { id: true, tenantId: true, agentId: true, runtime: true, metadata: { select: { actionsExecuted: true } } },
    })

    if (streamStatus === 'started') {
      logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_STREAM_STARTED, {
        callSid,
        agentId: call?.agentId,
        tenantId: call?.tenantId,
        runtime: call?.runtime ?? undefined,
      })

      await prisma.voiceAgentCall.updateMany({
        where: { callSid },
        data: { status: 'in-progress' },
      })

      if (call?.runtime === VOICE_CALL_RUNTIME.BOLNA) {
        armBolnaSilentFailureWatchdog(callSid, call.tenantId, call.agentId)
      }
    } else if (streamStatus === 'stopped') {
      clearBolnaSilentFailureWatchdog(callSid)
    } else if (streamStatus === 'failed') {
      clearBolnaSilentFailureWatchdog(callSid)
      logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_STREAM_FAILED, {
        callSid,
        agentId: call?.agentId,
        tenantId: call?.tenantId,
        reason: BOLNA_FALLBACK_REASONS.STREAM_CONNECT_FAILED,
      })

      if (call && call.runtime === VOICE_CALL_RUNTIME.BOLNA) {
        const existing = (call.metadata?.actionsExecuted as unknown[]) || []
        const audit = bolnaFallbackAuditEntry(BOLNA_FALLBACK_REASONS.STREAM_CONNECT_FAILED)
        await prisma.voiceAgentCall.update({
          where: { id: call.id },
          data: {
            runtime: VOICE_CALL_RUNTIME.BOLNA_STREAM_FAILED,
            status: 'failed',
            endTime: new Date(),
            metadata: {
              upsert: {
                create: { actionsExecuted: [...existing, audit] as any },
                update: { actionsExecuted: [...existing, audit] as any },
              },
            },
          },
        })
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[Twilio Connect Status] Error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
