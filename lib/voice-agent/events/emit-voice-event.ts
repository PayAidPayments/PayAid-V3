/**

 * Voice event emitter — console + session persistence hook.

 */



import type { PrismaClient } from '@prisma/client'

import type { VoiceEvent, VoiceEventName, VoiceEventPayload } from './voice-event-taxonomy'

import { formatVoiceEventLog } from './voice-event-taxonomy'

import { persistVoiceEventToDemoSession, persistVoiceEventToTable } from './persist-voice-event'



export type EmitVoiceEventOptions = {
  /** When true, also console.log structured JSON (default in development). */
  log?: boolean
  /** Persist to VoiceEvent table (and optional demo session metadata). */
  prisma?: PrismaClient
  /** When set with prisma, also append to VoiceDemoSession.metadataJson.voiceEvents. */
  sessionId?: string
  /** @deprecated Use prisma + sessionId */
  persistToSession?: {
    prisma: PrismaClient
    sessionId: string
  }
}



export async function emitVoiceEvent(

  event: VoiceEventName,

  payload: Omit<VoiceEventPayload, 'at'>,

  opts?: EmitVoiceEventOptions,

): Promise<VoiceEvent> {

  const evt: VoiceEvent = {

    event,

    payload: { ...payload, at: new Date().toISOString() },

  }



  const shouldLog =

    opts?.log ?? (process.env.NODE_ENV !== 'production' || process.env.VOICE_EVENT_LOG === '1')



  if (shouldLog) {

    console.log(formatVoiceEventLog(evt))

  }



  const prisma = opts?.prisma ?? opts?.persistToSession?.prisma
  const sessionId = opts?.sessionId ?? opts?.persistToSession?.sessionId ?? payload.sessionId

  if (prisma && sessionId) {
    try {
      await persistVoiceEventToDemoSession(prisma, sessionId, evt)
    } catch (e) {
      console.warn('[voice-event] session persist failed', e instanceof Error ? e.message : e)
    }
  } else if (prisma && payload.tenantId) {
    try {
      await persistVoiceEventToTable(prisma, evt)
    } catch (e) {
      console.warn('[voice-event] table persist failed', e instanceof Error ? e.message : e)
    }
  }

  return evt

}


