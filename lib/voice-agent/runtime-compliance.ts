/**
 * Tenant policy enforcement on every voice runtime path (browser-live + telephony).
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import {
  loadVoiceTenantCompliancePolicy,
  type VoiceConsentMode,
  type VoiceTenantCompliancePolicyView,
} from '@/lib/voice-agent/consent-policy'
import {
  computeTenantRetentionUntil,
  logVoiceComplianceAudit,
  recordOutboundDialCompliance,
  recordSessionComplianceCloseout,
  recordVoiceConsentCaptured,
  type VoiceComplianceChannel,
} from '@/lib/voice-agent/compliance-audit'

export type VoiceRuntimeChannel = VoiceComplianceChannel

export type VoiceRuntimePolicyFlags = {
  policy: VoiceTenantCompliancePolicyView
  recordingRequired: boolean
  transcriptRequired: boolean
  disclosureText: string | null
}

export async function loadVoiceRuntimePolicyFlags(
  prisma: PrismaClient,
  tenantId: string,
): Promise<VoiceRuntimePolicyFlags> {
  const policy = await loadVoiceTenantCompliancePolicy(prisma, tenantId)
  return {
    policy,
    recordingRequired: policy.recordingRequired,
    transcriptRequired: policy.transcriptRequired,
    disclosureText: policy.outboundDisclosureText?.trim() || null,
  }
}

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

async function snapshotPolicyOnCallMetadata(
  prisma: PrismaClient,
  callId: string,
  snapshot: Record<string, unknown>,
): Promise<void> {
  const existing = await prisma.voiceAgentCallMetadata.findUnique({
    where: { callId },
    select: { id: true, actionsExecuted: true },
  })
  const prior = Array.isArray(existing?.actionsExecuted) ? existing.actionsExecuted : []
  const actionsExecuted = [...prior, { type: 'compliance_policy', ...snapshot, at: new Date().toISOString() }]

  if (existing) {
    await prisma.voiceAgentCallMetadata.update({
      where: { id: existing.id },
      data: { actionsExecuted: toJson(actionsExecuted as unknown as Record<string, unknown>) },
    })
    return
  }

  await prisma.voiceAgentCallMetadata.create({
    data: {
      callId,
      actionsExecuted: toJson(actionsExecuted as unknown as Record<string, unknown>),
    },
  })
}

export async function recordBrowserLiveRuntimeComplianceStart(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    sessionId: string
    consentMode?: 'implied_demo' | 'explicit_toggle'
    crmWritebackEnabled?: boolean
    callerPhone?: string | null
  },
): Promise<VoiceRuntimePolicyFlags> {
  const flags = await loadVoiceRuntimePolicyFlags(prisma, input.tenantId)
  const consentMode: VoiceConsentMode =
    input.consentMode ??
    (flags.policy.consentMode === 'explicit_toggle' ? 'explicit_toggle' : 'implied_demo')

  await recordVoiceConsentCaptured(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    channel: 'browser_live',
    consentMode: consentMode === 'outbound_disclosure' ? 'implied_demo' : consentMode,
    crmWritebackEnabled: input.crmWritebackEnabled,
    callerPhone: input.callerPhone,
  })

  return flags
}

export async function recordTelephonyRuntimeComplianceStart(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    callId: string
    channel: Extract<VoiceRuntimeChannel, 'telephony' | 'campaign'>
    inbound?: boolean
    phone?: string | null
    campaignId?: string
  },
): Promise<VoiceRuntimePolicyFlags> {
  const flags = await loadVoiceRuntimePolicyFlags(prisma, input.tenantId)
  const at = new Date().toISOString()
  const consentMode: VoiceConsentMode =
    input.channel === 'campaign' || input.inbound === false
      ? 'outbound_disclosure'
      : flags.policy.consentMode

  if (input.channel === 'campaign' && input.phone) {
    await recordOutboundDialCompliance(prisma, {
      tenantId: input.tenantId,
      agentId: input.agentId,
      callId: input.callId,
      campaignId: input.campaignId,
      phone: input.phone,
    })
  } else {
    await logVoiceComplianceAudit(prisma, {
      action: 'consent.captured',
      at,
      tenantId: input.tenantId,
      agentId: input.agentId,
      callId: input.callId,
      channel: input.channel,
      detail: {
        consentMode,
        inbound: input.inbound !== false,
        recordingRequired: flags.recordingRequired,
        transcriptRequired: flags.transcriptRequired,
        disclosureText: flags.disclosureText,
        policyVersion: 'voice-compliance-v1',
      },
    })
  }

  await snapshotPolicyOnCallMetadata(prisma, input.callId, {
    consentMode,
    recordingRequired: flags.recordingRequired,
    transcriptRequired: flags.transcriptRequired,
    disclosureText: flags.disclosureText,
    channel: input.channel,
    inbound: input.inbound !== false,
  })

  return flags
}

export async function recordTelephonyRuntimeComplianceCloseout(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    callId: string
    channel: Extract<VoiceRuntimeChannel, 'telephony' | 'campaign'>
    hasRecording: boolean
    transcriptTurnCount: number
  },
): Promise<void> {
  const flags = await loadVoiceRuntimePolicyFlags(prisma, input.tenantId)
  const at = new Date().toISOString()
  const { retentionDays, retentionUntil } = await computeTenantRetentionUntil(prisma, input.tenantId)

  if (flags.recordingRequired && input.hasRecording) {
    await logVoiceComplianceAudit(prisma, {
      action: 'recording.stored',
      at,
      tenantId: input.tenantId,
      agentId: input.agentId,
      callId: input.callId,
      channel: input.channel,
      detail: { storage: 'telephony', policyEnforced: true },
    })
  }

  if (flags.transcriptRequired && input.transcriptTurnCount <= 0) {
    await logVoiceComplianceAudit(prisma, {
      action: 'consent.declined',
      at,
      tenantId: input.tenantId,
      agentId: input.agentId,
      callId: input.callId,
      channel: input.channel,
      detail: {
        reason: 'transcript_required_missing',
        transcriptTurnCount: input.transcriptTurnCount,
        policyVersion: 'voice-compliance-v1',
      },
    })
  }

  await logVoiceComplianceAudit(prisma, {
    action: 'retention.scheduled',
    at,
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    channel: input.channel,
    detail: {
      retentionDays,
      retentionUntil,
      transcriptTurnCount: input.transcriptTurnCount,
      recordingRequired: flags.recordingRequired,
      transcriptRequired: flags.transcriptRequired,
      policyVersion: 'voice-compliance-v1',
    },
  })
}

export async function recordBrowserLiveRuntimeComplianceCloseout(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    sessionId: string
    hasRecording: boolean
    transcriptTurnCount: number
  },
): Promise<void> {
  await recordSessionComplianceCloseout(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    channel: 'browser_live',
    hasRecording: input.hasRecording,
    transcriptTurnCount: input.transcriptTurnCount,
  })
}

export function prependOutboundDisclosure(greeting: string, disclosureText: string | null): string {
  const text = disclosureText?.trim()
  if (!text) return greeting
  if (greeting.toLowerCase().includes(text.slice(0, 24).toLowerCase())) return greeting
  return `${text} ${greeting}`.trim()
}
