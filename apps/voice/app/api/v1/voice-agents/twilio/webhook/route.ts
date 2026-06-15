/**
 * Twilio Webhook Handler — inbound Phase 1 cutover (Bolna stream or Gather fallback).
 * Webhook URL: /api/v1/voice-agents/twilio/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@payaid/db'
import { parseTwilioWebhook } from '@/lib/twilio-utils'
import {
  resolveTwilioWebhookValidationUrl,
  verifyTwilioInboundWebhookSignature,
} from '@/lib/voice-agent/twilio-webhook-signature'
import { syncVoiceCallToCrm } from '@/lib/voice-agent/crm-sync'
import { onTelephonyCallStarted } from '@/lib/voice-agent/events/telephony-voice-events'
import {
  loadVoiceRuntimePolicyFlags,
  prependOutboundDisclosure,
} from '@/lib/voice-agent/runtime-compliance'
import { resolveGreeting, shouldUseBolnaRuntime } from '@/lib/voice-agent/runtime/bolna'
import { prepareBolnaInbound, toVoiceAgentRow } from '@/lib/voice-agent/runtime/bolna-inbound'
import {
  VOICE_CALL_RUNTIME,
  VOICE_INBOUND_EVENTS,
  bolnaFallbackAuditEntry,
  logVoiceInbound,
} from '@/lib/voice-agent/runtime/inbound-observability'

const VoiceResponse = twilio.twiml.VoiceResponse

function twilioSayLanguage(language: string): string {
  if (language === 'hi') return 'hi-IN'
  if (language === 'en') return 'en-US'
  return language
}

function appendNativeGatherTwiml(
  twiml: InstanceType<typeof VoiceResponse>,
  origin: string,
  agent: { language: string },
  greeting: string,
): void {
  const sayLanguage = twilioSayLanguage(agent.language)
  const speechHandlerUrl = `${origin}/api/v1/voice-agents/twilio/speech-handler`
  twiml.say({ voice: 'alice', language: sayLanguage as any }, greeting)
  twiml.gather({
    input: ['speech'],
    action: speechHandlerUrl,
    method: 'POST',
    language: sayLanguage as any,
    speechTimeout: '2',
    timeout: 5,
  })
  twiml.redirect(speechHandlerUrl)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('X-Twilio-Signature') || ''
    const validationUrl = resolveTwilioWebhookValidationUrl(request.nextUrl.origin)
    const authToken = process.env.TWILIO_AUTH_TOKEN || ''

    if (
      !verifyTwilioInboundWebhookSignature({
        validationUrl,
        rawBody: body,
        signatureHeader: signature,
        authToken,
      })
    ) {
      console.error('[Twilio Webhook] Invalid signature')
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const params = parseTwilioWebhook(body)
    const { callSid, from, to, callStatus } = params
    const origin = request.nextUrl.origin
    const connectStatusUrl = `${origin}/api/v1/voice-agents/twilio/connect-status`

    logVoiceInbound(VOICE_INBOUND_EVENTS.RECEIVED, { callSid, detail: callStatus })

    const agent = await prisma.voiceAgent.findUnique({
      where: { phoneNumber: to },
      include: { trainingPack: true },
    })

    if (!agent) {
      console.error('[Twilio] Agent not found for number:', to)
      const twiml = new VoiceResponse()
      twiml.say(
        { voice: 'alice', language: 'en-US' },
        'Sorry, this number is not configured. Please contact support.',
      )
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
    }

    if (agent.status !== 'active') {
      console.error('[Twilio] Agent is not active:', agent.id)
      const twiml = new VoiceResponse()
      twiml.say(
        { voice: 'alice', language: 'en-US' },
        'Sorry, this service is currently unavailable.',
      )
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
    }

    logVoiceInbound(VOICE_INBOUND_EVENTS.AGENT_RESOLVED, {
      callSid,
      agentId: agent.id,
      tenantId: agent.tenantId,
    })

    const useBolna = shouldUseBolnaRuntime(agent)
    const initialRuntime = useBolna ? VOICE_CALL_RUNTIME.BOLNA : VOICE_CALL_RUNTIME.NATIVE

    const call = await prisma.voiceAgentCall.create({
      data: {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        from,
        to,
        phone: from,
        inbound: true,
        status: 'ringing',
        runtime: initialRuntime,
        startTime: new Date(),
      },
    })

    await onTelephonyCallStarted(prisma, {
      tenantId: agent.tenantId,
      agentId: agent.id,
      callId: call.id,
      callSid,
      inbound: true,
      channel: 'telephony',
      phone: from,
    })

    const policyFlags = await loadVoiceRuntimePolicyFlags(prisma, agent.tenantId)

    const twiml = new VoiceResponse()
    const agentRow = toVoiceAgentRow(agent)

    if (useBolna) {
      logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_ATTEMPT, {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        runtime: VOICE_CALL_RUNTIME.BOLNA,
      })

      const prepared = await prepareBolnaInbound({
        agent: agentRow,
        callSid,
        from,
        to,
        payaidOrigin: origin,
      })

      if (prepared.kind === 'stream') {
        const didSync = !agent.bolnaAgentId
        await prisma.voiceAgent.update({
          where: { id: agent.id },
          data: {
            bolnaAgentId: prepared.bolnaAgentId,
            runtimeSyncedAt: prepared.runtimeSyncedAt,
          },
        })

        if (didSync) {
          logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_SYNC_OK, {
            callSid,
            agentId: agent.id,
            tenantId: agent.tenantId,
          })
        }

        logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_STREAM_MINTED, {
          callSid,
          agentId: agent.id,
          tenantId: agent.tenantId,
        })

        twiml.connect({ action: connectStatusUrl, method: 'POST' }).stream({
          url: prepared.streamUrl,
          track: 'inbound_track',
        })

        logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_CONNECT_STREAM, {
          callSid,
          agentId: agent.id,
          tenantId: agent.tenantId,
        })

        return new NextResponse(twiml.toString(), {
          headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
        })
      }

      const audit = bolnaFallbackAuditEntry(prepared.reason)
      await prisma.voiceAgentCall.update({
        where: { id: call.id },
        data: { runtime: VOICE_CALL_RUNTIME.BOLNA_FALLBACK_GATHER },
      })
      await prisma.voiceAgentCallMetadata.upsert({
        where: { callId: call.id },
        create: { callId: call.id, actionsExecuted: [audit] as any },
        update: { actionsExecuted: [audit] as any },
      })

      logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_SYNC_FAILED, {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        reason: prepared.reason,
        detail: prepared.detail,
      })
      logVoiceInbound(VOICE_INBOUND_EVENTS.BOLNA_FALLBACK_GATHER, {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        runtime: VOICE_CALL_RUNTIME.BOLNA_FALLBACK_GATHER,
        reason: prepared.reason,
        detail: prepared.detail,
      })

      const greeting = prependOutboundDisclosure(resolveGreeting(agentRow), policyFlags.disclosureText)
      appendNativeGatherTwiml(twiml, origin, agent, greeting)
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
      })
    }

    logVoiceInbound(VOICE_INBOUND_EVENTS.NATIVE_GATHER, {
      callSid,
      agentId: agent.id,
      tenantId: agent.tenantId,
      runtime: VOICE_CALL_RUNTIME.NATIVE,
    })

    const greeting = prependOutboundDisclosure(resolveGreeting(agentRow), policyFlags.disclosureText)
    appendNativeGatherTwiml(twiml, origin, agent, greeting)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
    })
  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    const twiml = new VoiceResponse()
    twiml.say(
      { voice: 'alice', language: 'en-US' },
      'Sorry, something went wrong. Please try again later.',
    )
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callSid = searchParams.get('CallSid')
  const callStatus = searchParams.get('CallStatus')
  const callDuration = searchParams.get('CallDuration')

  if (callSid) {
    try {
      const durationSec = callDuration ? parseInt(callDuration, 10) : undefined
      await prisma.voiceAgentCall.updateMany({
        where: { callSid },
        data: {
          status:
            callStatus === 'completed'
              ? 'completed'
              : callStatus === 'in-progress'
                ? 'in-progress'
                : callStatus === 'failed'
                  ? 'failed'
                  : 'ringing',
          endTime:
            callStatus === 'completed' || callStatus === 'failed' ? new Date() : undefined,
          ...(durationSec !== undefined &&
            !isNaN(durationSec) && { durationSeconds: durationSec }),
        },
      })
      if (callStatus === 'completed') {
        try {
          await syncVoiceCallToCrm(callSid)
        } catch (crmError) {
          console.error('[Twilio Status] CRM sync failed:', crmError)
        }
      }
    } catch (error) {
      console.error('[Twilio Status] Error updating call:', error)
    }
  }

  return new NextResponse('OK', { status: 200 })
}
