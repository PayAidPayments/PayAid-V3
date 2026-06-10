/**

 * Emit blueprint voice events from browser-live sidecar wire messages.

 */



import type { PrismaClient } from '@prisma/client'

import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'

import {

  mapBrowserLiveToVoiceEvent,

  type VoiceEventName,

} from '@/lib/voice-agent/events/voice-event-taxonomy'



export type BrowserLiveEventContext = {

  tenantId: string

  agentId?: string

  sessionId?: string

  meta?: Record<string, unknown>

}



export type BrowserLiveEventBridgeOpts = {

  prisma?: PrismaClient

}



function persistOpts(

  ctx: BrowserLiveEventContext,

  opts?: BrowserLiveEventBridgeOpts,

) {

  if (!opts?.prisma || !ctx.sessionId) return undefined

  return { prisma: opts.prisma, sessionId: ctx.sessionId }

}



export async function emitBrowserLiveWireEvent(

  wireType: string,

  ctx: BrowserLiveEventContext,

  opts?: BrowserLiveEventBridgeOpts,

): Promise<void> {

  const mapped = mapBrowserLiveToVoiceEvent(wireType, {

    tenantId: ctx.tenantId,

    agentId: ctx.agentId,

    sessionId: ctx.sessionId,

    meta: ctx.meta,

  })

  if (mapped) {

    await emitVoiceEvent(mapped.event, mapped.payload, { persistToSession: persistOpts(ctx, opts) })

  }

}



export async function emitPostCallVoiceEvents(

  input: {

    tenantId: string

    agentId: string

    sessionId: string

    routing: string

    disposition: string

    summary: string

    sentiment?: string

    objectionTags?: string[]

    escalationHandoff?: Record<string, unknown>

  },

  opts?: BrowserLiveEventBridgeOpts,

): Promise<void> {

  const base = {

    tenantId: input.tenantId,

    agentId: input.agentId,

    sessionId: input.sessionId,

  }

  const persist = persistOpts(base, opts)



  await emitVoiceEvent('summary.ready', {

    ...base,

    meta: {

      disposition: input.disposition,

      summaryPreview: input.summary.slice(0, 300),

      sentiment: input.sentiment,

      objectionTags: input.objectionTags,

    },

  }, { persistToSession: persist })



  if (input.routing === 'unmatched_lead') {

    await emitVoiceEvent('crm.match.failed', {

      ...base,

      meta: { action: 'voice_lead_unverified_created', routing: input.routing },

    }, { persistToSession: persist })

  }

  if (input.objectionTags?.includes('escalation_request')) {

    await emitVoiceEvent('escalation.requested', {

      ...base,

      meta: {
        routing: input.routing,
        objectionTags: input.objectionTags,
        handoff: input.escalationHandoff,
      },

    }, { persistToSession: persist })

  }

}



export async function emitVoiceEventDirect(

  event: VoiceEventName,

  ctx: BrowserLiveEventContext,

  opts?: BrowserLiveEventBridgeOpts,

): Promise<void> {

  await emitVoiceEvent(event, {

    tenantId: ctx.tenantId,

    agentId: ctx.agentId,

    sessionId: ctx.sessionId,

    meta: ctx.meta,

  }, { persistToSession: persistOpts(ctx, opts) })

}


