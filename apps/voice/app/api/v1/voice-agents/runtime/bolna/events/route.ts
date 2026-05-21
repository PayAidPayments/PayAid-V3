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
 * We update `voiceAgentCall` (status, transcript JSON, latency KPIs) and let
 * the existing analytics surface read from the same row.
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
  // Optional payloads — different kinds use different fields.
  text?: string
  role?: 'user' | 'assistant'
  language?: string
  timings?: BolnaTurnTimings
  durationSeconds?: number
  status?: string // for call_ended: completed | failed | etc
  tokens?: number // for barge_in: how many LLM tokens were flushed
  detail?: unknown
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
        const call = await prisma.voiceAgentCall.findFirst({
          where: { callSid, tenantId },
          select: {
            id: true,
            transcript: true,
            firstAudioMs: true,
            metadata: { select: { id: true, ttsLatencyMs: true } },
          },
        })
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
        break
      }

      case 'tool_call':
      case 'transcript_partial': {
        // Informational — don't persist yet (would explode write load).
        // Stage 1: stream to a Redis channel for live UI in the dashboard.
        break
      }

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
