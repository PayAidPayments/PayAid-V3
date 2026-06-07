/**
 * Outbound campaign call completion — Twilio status webhook → VoiceAgentCall + campaign contact.
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'

const TERMINAL_STATUSES = new Set([
  'completed',
  'busy',
  'no-answer',
  'failed',
  'canceled',
  'cancelled',
])

function mapContactStatus(callStatus: string): 'completed' | 'failed' {
  const s = callStatus.toLowerCase()
  if (s === 'completed') return 'completed'
  return 'failed'
}

function mapCallStatus(callStatus: string): string {
  const s = callStatus.toLowerCase()
  if (s === 'completed') return 'completed'
  if (s === 'in-progress' || s === 'answered') return 'in-progress'
  if (s === 'ringing' || s === 'initiated') return 'ringing'
  return 'failed'
}

export type TwilioCallStatusInput = {
  callSid: string
  callStatus: string
  callDuration?: string | number | null
}

export type TwilioCallStatusResult = {
  updated: boolean
  callId?: string
  campaignContactId?: string
  contactStatus?: string
}

export async function applyTwilioCallStatusUpdate(
  prisma: PrismaClient,
  input: TwilioCallStatusInput,
): Promise<TwilioCallStatusResult> {
  const call = await prisma.voiceAgentCall.findFirst({
    where: { callSid: input.callSid },
    select: {
      id: true,
      tenantId: true,
      agentId: true,
      status: true,
    },
  })
  if (!call) return { updated: false }

  const nextStatus = mapCallStatus(input.callStatus)
  const duration =
    input.callDuration != null && input.callDuration !== ''
      ? Number.parseInt(String(input.callDuration), 10)
      : undefined

  const isTerminal = TERMINAL_STATUSES.has(input.callStatus.toLowerCase())

  await prisma.voiceAgentCall.update({
    where: { id: call.id },
    data: {
      status: nextStatus,
      ...(isTerminal
        ? {
            endTime: new Date(),
            durationSeconds: Number.isFinite(duration) ? duration : undefined,
          }
        : {}),
    },
  })

  const contact = await prisma.voiceAgentCampaignContact.findFirst({
    where: { callId: call.id },
    select: { id: true, status: true, campaignId: true },
  })

  let contactStatus: string | undefined
  if (contact && isTerminal) {
    contactStatus = mapContactStatus(input.callStatus)
    await prisma.voiceAgentCampaignContact.update({
      where: { id: contact.id },
      data: {
        status: contactStatus,
        completedAt: new Date(),
      },
    })

    const remaining = await prisma.voiceAgentCampaignContact.count({
      where: {
        campaignId: contact.campaignId,
        status: { in: ['pending', 'calling'] },
      },
    })
    if (remaining === 0) {
      await prisma.voiceAgentCampaign.update({
        where: { id: contact.campaignId },
        data: { status: 'completed', completedAt: new Date() },
      })
    }
  }

  if (isTerminal && input.callStatus.toLowerCase() === 'completed') {
    await emitVoiceEvent('call.completed', {
      tenantId: call.tenantId,
      agentId: call.agentId,
      callId: call.id,
      meta: {
        outbound: true,
        callSid: input.callSid,
        durationSeconds: duration,
        campaignContactId: contact?.id,
      },
    })
  }

  return {
    updated: true,
    callId: call.id,
    campaignContactId: contact?.id,
    contactStatus,
  }
}
