/**
 * Tenant bridge: per-turn / call lifecycle events from Bolna.
 *
 * Bolna POSTs events here as the call progresses:
 *   - call_started, call_ended
 *   - transcript_partial, transcript_final
 *   - assistant_response (full text after streaming TTS)
 *   - barge_in (user interrupted assistant)
 *   - tool_call (informational; the actual execution goes through /tools/execute)
 *   - error
 *
 * Auth: shared bridge secret + per-call JWT.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateBolnaBridge } from '@/lib/voice-agent/runtime/bridge-auth'
import {
  appendBolnaTranscript,
  pickFirstAudioMs,
  pickTtsLatencyMs,
  type BolnaTurnTimings,
} from '@/lib/voice-agent/runtime/bolna-events'
import { markBolnaCallStarted } from '@/lib/voice-agent/runtime/bolna-watchdog'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import {
  emitTelephonyTranscriptPartial,
  emitTelephonyVoiceEvent,
  onTelephonyCallCompleted,
} from '@/lib/voice-agent/events/telephony-voice-events'

export const runtime = 'nodejs'

type EventKind =
  | 'call_started'
  | 'call_ended'
  | 'transcript_partial'
  | 'transcript_final'
  | 'assistant_response'
  | 'barge_in'
  | 'tool_call'
  | 'error'

interface BolnaEvent {
  kind?: EventKind
  text?: string
  role?: 'user' | 'assistant'
  language?: string
  timings?: BolnaTurnTimings
  durationSeconds?: number
  status?: string
  tokens?: number
  detail?: unknown
}

async function loadCallBySid(callSid: string, tenantId: string) {
  return prisma.voiceAgentCall.findFirst({
    where: { callSid, tenantId },
    select: {
      id: true,
      agentId: true,
      inbound: true,
      transcript: true,
      recordingUrl: true,
      firstAudioMs: true,
      metadata: { select: { id: true, ttsLatencyMs: true } },
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = authenticateBolnaBridge(request.headers)
  if (!auth.ok) return auth.response

  const event = (await request.json().catch(() => ({}))) as BolnaEvent
  const kind = event.kind
  if (!kind) {
    return NextResponse.json({ error: 'event.kind is required' }, { status: 400 })
  }

  const { callSid, tenantId } = auth.claims

  try {
    switch (kind) {
      case 'call_started': {
        markBolnaCallStarted(callSid)
        await prisma.voiceAgentCall.updateMany({
          where: { callSid, tenantId },
          data: {
            status: 'in-progress',
            startTime: new Date(),
            languageUsed: event.language ?? undefined,
          },
        })
        const call = await loadCallBySid(callSid, tenantId)
        if (call) {
          await emitTelephonyVoiceEvent(prisma, 'call.started', {
            tenantId,
            agentId: call.agentId,
            callId: call.id,
            meta: { channel: 'telephony', callSid, runtime: 'bolna', streamReady: true },
          })
        }
        break
      }

      case 'call_ended': {
        await prisma.voiceAgentCall.updateMany({
          where: { callSid, tenantId },
          data: {
            status: event.status === 'failed' ? 'failed' : 'completed',
            endTime: new Date(),
            durationSeconds: event.durationSeconds ?? undefined,
          },
        })
        const call = await loadCallBySid(callSid, tenantId)
        if (call && event.status !== 'failed') {
          await onTelephonyCallCompleted(prisma, {
            tenantId,
            agentId: call.agentId,
            callId: call.id,
            callSid,
            channel: 'telephony',
            status: event.status ?? 'completed',
            transcript: call.transcript,
            recordingUrl: call.recordingUrl,
            syncCrm: true,
          })
        }
        break
      }

      case 'transcript_final':
      case 'assistant_response': {
        const role: 'user' | 'assistant' =
          kind === 'assistant_response'
            ? 'assistant'
            : event.role === 'assistant'
              ? 'assistant'
              : 'user'
        const text = (event.text || '').trim()
        if (!text) break
        const call = await loadCallBySid(callSid, tenantId)
        if (!call) break
        const nextTranscript = appendBolnaTranscript(call.transcript, { role, content: text })
        const firstAudio = pickFirstAudioMs(event.timings)
        const ttsLatency = pickTtsLatencyMs(event.timings)

        await prisma.voiceAgentCall.update({
          where: { id: call.id },
          data: {
            transcript: nextTranscript,
            languageUsed: event.language ?? undefined,
            firstAudioMs:
              firstAudio !== undefined && (call.firstAudioMs === null || call.firstAudioMs === undefined)
                ? firstAudio
                : undefined,
          },
        })

        if (ttsLatency !== undefined) {
          if (call.metadata) {
            await prisma.voiceAgentCallMetadata.update({
              where: { id: call.metadata.id },
              data: { ttsLatencyMs: ttsLatency },
            })
          } else {
            await prisma.voiceAgentCallMetadata.create({
              data: { callId: call.id, ttsLatencyMs: ttsLatency },
            })
          }
        }

        await emitTelephonyTranscriptPartial(prisma, {
          tenantId,
          agentId: call.agentId,
          callId: call.id,
          text,
          final: true,
          role,
        })
        break
      }

      case 'barge_in': {
        await prisma.voiceAgentCall.updateMany({
          where: { callSid, tenantId },
          data: {
            bargeInCount: { increment: 1 },
            interruptedTokens: event.tokens ? { increment: event.tokens } : undefined,
          },
        })
        const call = await loadCallBySid(callSid, tenantId)
        if (call) {
          await emitVoiceEvent(
            'barge_in.detected',
            {
              tenantId,
              agentId: call.agentId,
              callId: call.id,
              meta: { tokens: event.tokens, channel: 'telephony' },
            },
            { prisma },
          )
        }
        break
      }

      case 'transcript_partial': {
        const text = (event.text || '').trim()
        if (!text) break
        const call = await loadCallBySid(callSid, tenantId)
        if (!call) break
        await emitTelephonyTranscriptPartial(prisma, {
          tenantId,
          agentId: call.agentId,
          callId: call.id,
          text,
          final: false,
          role: event.role,
        })
        break
      }

      case 'tool_call':
        break

      case 'error': {
        console.error('[runtime/bolna/events] Bolna reported error for call', callSid, event.detail)
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[runtime/bolna/events] persist failed:', error)
    return NextResponse.json(
      { ok: false, detail: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
