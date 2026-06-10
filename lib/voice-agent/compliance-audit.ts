/**
 * Voice compliance audit trail (Phase 3.1) — consent, retention, redaction.
 * Dual-writes to AuditLog + session/call metadata for operator review.
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { resolveTenantRetentionDays } from '@/lib/voice-agent/consent-policy'

export const VOICE_COMPLIANCE_ENTITY_TYPE = 'voice_compliance'
export const VOICE_COMPLIANCE_ACTOR = 'system:voice-compliance'

export type VoiceComplianceChannel = 'browser_live' | 'telephony' | 'campaign'

export type VoiceComplianceAction =
  | 'consent.captured'
  | 'consent.declined'
  | 'recording.stored'
  | 'retention.scheduled'
  | 'redaction.applied'
  | 'transcript.exported'

export type VoiceComplianceAuditEntry = {
  action: VoiceComplianceAction
  at: string
  tenantId: string
  sessionId?: string
  callId?: string
  agentId?: string
  actorId?: string
  channel: VoiceComplianceChannel
  detail?: Record<string, unknown>
}

const MAX_SESSION_COMPLIANCE_ENTRIES = 50

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export function voiceRecordingRetentionDays(): number {
  const raw = process.env.VOICE_RECORDING_RETENTION_DAYS?.trim()
  const n = raw ? Number(raw) : 90
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 3650) : 90
}

export function computeRetentionUntil(from: Date = new Date(), retentionDays?: number): string {
  const days = retentionDays ?? voiceRecordingRetentionDays()
  const until = new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
  return until.toISOString()
}

export async function computeTenantRetentionUntil(
  prisma: PrismaClient,
  tenantId: string,
  from: Date = new Date(),
): Promise<{ retentionDays: number; retentionUntil: string }> {
  const retentionDays = await resolveTenantRetentionDays(prisma, tenantId)
  return {
    retentionDays,
    retentionUntil: computeRetentionUntil(from, retentionDays),
  }
}

export function redactPhoneNumbers(text: string): string {
  return text.replace(/\+?\d[\d\s-]{8,14}\d/g, '[REDACTED_PHONE]')
}

export function redactEmails(text: string): string {
  return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
}

export function redactVoiceText(text: string): string {
  return redactEmails(redactPhoneNumbers(text))
}

export async function appendComplianceToDemoSession(
  prisma: PrismaClient,
  sessionId: string,
  entry: VoiceComplianceAuditEntry,
): Promise<void> {
  const session = await prisma.voiceDemoSession.findUnique({
    where: { id: sessionId },
    select: { metadataJson: true },
  })
  if (!session) return

  const prior = readMeta(session.metadataJson)
  const existing = Array.isArray(prior.complianceAudit)
    ? (prior.complianceAudit as VoiceComplianceAuditEntry[])
    : []
  const complianceAudit = [...existing, entry].slice(-MAX_SESSION_COMPLIANCE_ENTRIES)

  await prisma.voiceDemoSession.update({
    where: { id: sessionId },
    data: {
      metadataJson: toInputJsonValue({
        ...prior,
        complianceAudit,
        lastComplianceAt: entry.at,
      }),
    },
  })
}

export async function logVoiceComplianceAudit(
  prisma: PrismaClient,
  entry: VoiceComplianceAuditEntry,
): Promise<void> {
  const entityId = entry.sessionId || entry.callId || entry.agentId || entry.tenantId
  const summary = `Voice ${entry.action} (${entry.channel})`

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        entityType: VOICE_COMPLIANCE_ENTITY_TYPE,
        entityId,
        changedBy: entry.actorId || VOICE_COMPLIANCE_ACTOR,
        changeSummary: summary,
        afterSnapshot: entry as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.warn('[voice-compliance] AuditLog write failed:', error)
  }

  if (entry.sessionId) {
    try {
      await appendComplianceToDemoSession(prisma, entry.sessionId, entry)
    } catch (error) {
      console.warn('[voice-compliance] session metadata append failed:', error)
    }
  }
}

export async function recordVoiceConsentCaptured(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    sessionId: string
    channel: VoiceComplianceChannel
    consentMode: 'implied_demo' | 'explicit_toggle'
    crmWritebackEnabled?: boolean
    callerPhone?: string | null
  },
): Promise<void> {
  await logVoiceComplianceAudit(prisma, {
    action: 'consent.captured',
    at: new Date().toISOString(),
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    channel: input.channel,
    detail: {
      consentMode: input.consentMode,
      recordingDisclosed: true,
      crmWritebackEnabled: input.crmWritebackEnabled !== false,
      callerPhonePresent: Boolean(input.callerPhone?.trim()),
      policyVersion: 'voice-compliance-v1',
    },
  })
}

export async function recordSessionComplianceCloseout(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    sessionId: string
    channel: VoiceComplianceChannel
    hasRecording: boolean
    transcriptTurnCount: number
  },
): Promise<void> {
  const at = new Date().toISOString()
  const { retentionDays, retentionUntil } = await computeTenantRetentionUntil(
    prisma,
    input.tenantId,
  )

  if (input.hasRecording) {
    await logVoiceComplianceAudit(prisma, {
      action: 'recording.stored',
      at,
      tenantId: input.tenantId,
      agentId: input.agentId,
      sessionId: input.sessionId,
      channel: input.channel,
      detail: { storage: 'session_metadata', mime: 'audio/webm' },
    })
  }

  await logVoiceComplianceAudit(prisma, {
    action: 'retention.scheduled',
    at,
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    channel: input.channel,
    detail: {
      retentionDays,
      retentionUntil,
      transcriptTurnCount: input.transcriptTurnCount,
    },
  })
}

export async function recordOutboundDialCompliance(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    callId: string
    campaignId?: string
    phone: string
  },
): Promise<void> {
  await logVoiceComplianceAudit(prisma, {
    action: 'consent.captured',
    at: new Date().toISOString(),
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    channel: 'campaign',
    detail: {
      consentMode: 'outbound_disclosure',
      campaignId: input.campaignId,
      phoneMasked: redactPhoneNumbers(input.phone),
      policyVersion: 'voice-compliance-v1',
    },
  })
}

export async function recordRedactionApplied(
  prisma: PrismaClient,
  input: {
    tenantId: string
    actorId?: string
    sessionId?: string
    exportKind: 'inbox' | 'transcript' | 'compliance_export'
    fieldCount: number
  },
): Promise<void> {
  await logVoiceComplianceAudit(prisma, {
    action: 'redaction.applied',
    at: new Date().toISOString(),
    tenantId: input.tenantId,
    actorId: input.actorId,
    sessionId: input.sessionId,
    channel: 'browser_live',
    detail: {
      exportKind: input.exportKind,
      fieldsRedacted: input.fieldCount,
    },
  })
}

export async function loadVoiceComplianceAudit(
  prisma: PrismaClient,
  input: { tenantId: string; sessionId?: string; limit?: number },
): Promise<VoiceComplianceAuditEntry[]> {
  const limit = Math.min(input.limit ?? 50, 200)
  const rows = await prisma.auditLog.findMany({
    where: {
      tenantId: input.tenantId,
      entityType: VOICE_COMPLIANCE_ENTITY_TYPE,
      ...(input.sessionId ? { entityId: input.sessionId } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: { afterSnapshot: true, timestamp: true },
  })

  return rows
    .map((r) => {
      const snap = r.afterSnapshot
      if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
        return snap as VoiceComplianceAuditEntry
      }
      return null
    })
    .filter((e): e is VoiceComplianceAuditEntry => e != null)
}
