/**
 * Phase 1 inbound Bolna prep: env checks, lazy sync, stream URL minting.
 */

import {
  buildBolnaStreamUrl,
  isBolnaRuntimeEnabled,
  readEnvForInbound,
  syncBolnaAgent,
} from './bolna'
import type { VoiceAgentRow } from './types'
import type { TrainingPackApprovedSnapshot } from '../training-pack-types'
import { loadApprovedTrainingSnapshot } from '../training-pack-load'
import {
  BOLNA_FALLBACK_REASONS,
  type BolnaFallbackReason,
} from './inbound-observability'

export type PrepareBolnaInboundSuccess = {
  kind: 'stream'
  streamUrl: string
  bolnaAgentId: string
  runtimeSyncedAt: Date
}

export type PrepareBolnaInboundFallback = {
  kind: 'fallback'
  reason: BolnaFallbackReason
  detail?: string
}

export type PrepareBolnaInboundResult = PrepareBolnaInboundSuccess | PrepareBolnaInboundFallback

export function toVoiceAgentRow(agent: {
  id: string
  tenantId: string
  name: string
  description?: string | null
  language: string
  voiceId?: string | null
  voiceTone?: string | null
  systemPrompt: string
  phoneNumber?: string | null
  status: string
  knowledgeBase?: unknown
  functions?: unknown
  workflow?: unknown
  compliance?: unknown
  voiceRuntime?: string | null
  bolnaAgentId?: string | null
  runtimeSyncedAt?: Date | null
  trainingPack?: { approvedJson: unknown } | null
}): VoiceAgentRow {
  let trainingPackApproved: TrainingPackApprovedSnapshot | null = null
  const approved = agent.trainingPack?.approvedJson
  if (approved && typeof approved === 'object') {
    trainingPackApproved = approved as TrainingPackApprovedSnapshot
  }
  return {
    id: agent.id,
    tenantId: agent.tenantId,
    name: agent.name,
    description: agent.description,
    language: agent.language,
    voiceId: agent.voiceId,
    voiceTone: agent.voiceTone,
    systemPrompt: agent.systemPrompt,
    phoneNumber: agent.phoneNumber,
    status: agent.status,
    knowledgeBase: agent.knowledgeBase,
    functions: agent.functions,
    workflow: agent.workflow,
    compliance: agent.compliance,
    voiceRuntime: agent.voiceRuntime,
    bolnaAgentId: agent.bolnaAgentId,
    runtimeSyncedAt: agent.runtimeSyncedAt,
    trainingPackApproved,
  }
}

function envFallback(reason: BolnaFallbackReason, detail: string): PrepareBolnaInboundFallback {
  return { kind: 'fallback', reason, detail }
}

export async function prepareBolnaInbound(args: {
  agent: VoiceAgentRow
  callSid: string
  from: string
  to: string
  payaidOrigin: string
}): Promise<PrepareBolnaInboundResult> {
  if (!isBolnaRuntimeEnabled()) {
    return envFallback(BOLNA_FALLBACK_REASONS.ENV_DISABLED, 'VOICE_AGENT_BOLNA_ENABLED is not 1')
  }

  const envCheck = readEnvForInbound()
  if (!envCheck.ok) {
    return envFallback(envCheck.reason, envCheck.detail)
  }

  let row = { ...args.agent }
  if (!row.trainingPackApproved) {
    const snap = await loadApprovedTrainingSnapshot(row.id, row.tenantId)
    row = { ...row, trainingPackApproved: snap }
  }

  try {
    if (!row.bolnaAgentId) {
      const synced = await syncBolnaAgent(row)
      row = {
        ...row,
        bolnaAgentId: synced.bolnaAgentId,
        runtimeSyncedAt: synced.syncedAt,
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return envFallback(BOLNA_FALLBACK_REASONS.SYNC_HTTP_ERROR, detail.slice(0, 500))
  }

  if (!row.bolnaAgentId) {
    return envFallback(BOLNA_FALLBACK_REASONS.MISSING_BOLNA_AGENT_ID, 'sync returned no bolnaAgentId')
  }

  try {
    const { streamUrl } = buildBolnaStreamUrl({
      agent: row,
      callSid: args.callSid,
      from: args.from,
      to: args.to,
      payaidOrigin: args.payaidOrigin,
    })
    if (!streamUrl.startsWith('wss://')) {
      return envFallback(BOLNA_FALLBACK_REASONS.STREAM_URL_ERROR, 'stream URL must use wss://')
    }
    return {
      kind: 'stream',
      streamUrl,
      bolnaAgentId: row.bolnaAgentId,
      runtimeSyncedAt: row.runtimeSyncedAt ?? new Date(),
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return envFallback(BOLNA_FALLBACK_REASONS.STREAM_URL_ERROR, detail.slice(0, 500))
  }
}
