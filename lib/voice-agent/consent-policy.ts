/**
 * Tenant voice compliance / consent policy (blueprint Tier 3).
 */
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'

export const VOICE_CONSENT_MODES = ['explicit_toggle', 'implied_demo', 'outbound_disclosure'] as const
export type VoiceConsentMode = (typeof VOICE_CONSENT_MODES)[number]

export type VoiceTenantCompliancePolicyView = {
  recordingRequired: boolean
  transcriptRequired: boolean
  consentMode: VoiceConsentMode
  retentionDays: number
  redactExportsByDefault: boolean
  outboundDisclosureText: string | null
  updatedAt?: string
}

export const DEFAULT_VOICE_COMPLIANCE_POLICY: VoiceTenantCompliancePolicyView = {
  recordingRequired: true,
  transcriptRequired: true,
  consentMode: 'explicit_toggle',
  retentionDays: 90,
  redactExportsByDefault: true,
  outboundDisclosureText:
    'This call may be recorded for quality and training purposes.',
}

export const voiceCompliancePolicySchema = z.object({
  recordingRequired: z.boolean(),
  transcriptRequired: z.boolean(),
  consentMode: z.enum(VOICE_CONSENT_MODES),
  retentionDays: z.number().int().min(1).max(3650),
  redactExportsByDefault: z.boolean(),
  outboundDisclosureText: z.string().max(2000).nullable().optional(),
})

export type VoiceCompliancePolicyInput = z.infer<typeof voiceCompliancePolicySchema>

export async function loadVoiceTenantCompliancePolicy(
  prisma: PrismaClient,
  tenantId: string,
): Promise<VoiceTenantCompliancePolicyView> {
  const row = await prisma.voiceTenantCompliancePolicy.findUnique({
    where: { tenantId },
  })
  if (!row) return { ...DEFAULT_VOICE_COMPLIANCE_POLICY }
  return {
    recordingRequired: row.recordingRequired,
    transcriptRequired: row.transcriptRequired,
    consentMode: row.consentMode as VoiceConsentMode,
    retentionDays: row.retentionDays,
    redactExportsByDefault: row.redactExportsByDefault,
    outboundDisclosureText: row.outboundDisclosureText,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function saveVoiceTenantCompliancePolicy(
  prisma: PrismaClient,
  tenantId: string,
  input: VoiceCompliancePolicyInput,
): Promise<VoiceTenantCompliancePolicyView> {
  const parsed = voiceCompliancePolicySchema.parse(input)
  const row = await prisma.voiceTenantCompliancePolicy.upsert({
    where: { tenantId },
    create: {
      tenantId,
      ...parsed,
      outboundDisclosureText: parsed.outboundDisclosureText ?? null,
    },
    update: {
      ...parsed,
      outboundDisclosureText: parsed.outboundDisclosureText ?? null,
    },
  })
  return {
    recordingRequired: row.recordingRequired,
    transcriptRequired: row.transcriptRequired,
    consentMode: row.consentMode as VoiceConsentMode,
    retentionDays: row.retentionDays,
    redactExportsByDefault: row.redactExportsByDefault,
    outboundDisclosureText: row.outboundDisclosureText,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function resolveTenantRetentionDays(
  prisma: PrismaClient,
  tenantId: string,
): Promise<number> {
  const policy = await loadVoiceTenantCompliancePolicy(prisma, tenantId)
  return policy.retentionDays
}
