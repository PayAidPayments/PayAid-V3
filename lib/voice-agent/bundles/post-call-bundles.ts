/**
 * Cross-module post-call bundles (blueprint §3.4): finance collections, support case, marketing hot-lead.
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { createVoiceCrmLink } from '@/lib/voice-agent/crm-link'

export type PostCallBundleContext = {
  tenantId: string
  voiceSessionId?: string
  voiceCallId?: string
  summary?: string
  disposition?: string
  objectionTags?: string[]
  invoiceId?: string | null
  caseId?: string | null
  dealId?: string | null
  interactionId?: string | null
}

export type PostCallBundleResult = {
  finance?: { invoiceId: string; promiseToPay: boolean }
  support?: { caseId: string }
  marketing?: { hotLead: boolean; skipped?: boolean }
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function inferPromiseToPay(disposition?: string, objectionTags?: string[]): boolean {
  const tags = objectionTags ?? []
  if (tags.some((t) => /promise|payment|pay/i.test(t))) return true
  if (disposition && /promise|payment|collections/i.test(disposition)) return true
  return false
}

export async function applyFinanceCollectionsBundle(
  prisma: PrismaClient,
  ctx: PostCallBundleContext,
): Promise<PostCallBundleResult['finance'] | null> {
  const invoiceId = ctx.invoiceId?.trim()
  if (!invoiceId) return null

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: { id: true, metadata: true, notes: true },
  })
  if (!invoice) return null

  const promiseToPay = inferPromiseToPay(ctx.disposition, ctx.objectionTags)
  const touch = {
    at: new Date().toISOString(),
    channel: 'voice_agent',
    voiceSessionId: ctx.voiceSessionId,
    voiceCallId: ctx.voiceCallId,
    summary: ctx.summary?.slice(0, 500),
    disposition: ctx.disposition,
    promiseToPay,
    followupDueAt: promiseToPay
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  }

  const priorMeta = readMeta(invoice.metadata)
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      metadata: toJson({
        ...priorMeta,
        lastVoiceCollectionsTouch: touch,
      }),
      notes: invoice.notes
        ? `${invoice.notes}\n\n[Voice] ${touch.summary || ctx.disposition || 'collections call'}`
        : `[Voice] ${touch.summary || ctx.disposition || 'collections call'}`,
    },
  })

  await createVoiceCrmLink(prisma, {
    tenantId: ctx.tenantId,
    voiceSessionId: ctx.voiceSessionId,
    voiceCallId: ctx.voiceCallId,
    entityType: 'invoice',
    entityId: invoice.id,
    createMode: 'bundle_ref',
    metadata: { bundle: 'finance_collections', promiseToPay, touch },
  })

  return { invoiceId: invoice.id, promiseToPay }
}

export async function applySupportCaseBundle(
  prisma: PrismaClient,
  ctx: PostCallBundleContext,
): Promise<PostCallBundleResult['support'] | null> {
  const caseId = ctx.caseId?.trim()
  if (!caseId) return null

  const escalation = (ctx.objectionTags ?? []).includes('escalation_request')
  const update = {
    at: new Date().toISOString(),
    caseId,
    voiceSessionId: ctx.voiceSessionId,
    voiceCallId: ctx.voiceCallId,
    summary: ctx.summary?.slice(0, 500),
    disposition: ctx.disposition,
    escalationReason: escalation ? 'escalation_request' : undefined,
    resolutionStatus: escalation ? 'escalated' : 'updated',
  }

  if (ctx.interactionId) {
    const interaction = await prisma.interaction.findFirst({
      where: { id: ctx.interactionId },
      select: { id: true, notes: true },
    })
    if (interaction) {
      const note = `[Support case ${caseId}] ${update.summary || update.disposition || 'voice update'}`
      await prisma.interaction.update({
        where: { id: interaction.id },
        data: {
          notes: interaction.notes ? `${interaction.notes}\n\n${note}` : note,
        },
      })
    }
  }

  await createVoiceCrmLink(prisma, {
    tenantId: ctx.tenantId,
    voiceSessionId: ctx.voiceSessionId,
    voiceCallId: ctx.voiceCallId,
    entityType: 'case',
    entityId: caseId,
    createMode: 'bundle_ref',
    metadata: { bundle: 'support_case', ...update },
  })

  return { caseId }
}

export function marketingHotLeadMinScore(): number {
  const raw = process.env.VOICE_MARKETING_HOT_LEAD_MIN_SCORE?.trim()
  const n = raw ? Number(raw) : 70
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 70
}

export function qualifiesAsMarketingHotLead(hotLeadScore?: number | null): boolean {
  if (hotLeadScore == null || !Number.isFinite(hotLeadScore)) return true
  return hotLeadScore >= marketingHotLeadMinScore()
}

export async function applyPostCallCrossModuleBundles(
  prisma: PrismaClient,
  ctx: PostCallBundleContext,
): Promise<PostCallBundleResult> {
  const result: PostCallBundleResult = {}

  const finance = await applyFinanceCollectionsBundle(prisma, ctx)
  if (finance) result.finance = finance

  const support = await applySupportCaseBundle(prisma, ctx)
  if (support) result.support = support

  return result
}

export function readBundleIdsFromMetadata(meta: Record<string, unknown>): {
  invoiceId?: string
  caseId?: string
  dealId?: string
} {
  const trigger = readMeta(meta.triggerContext)
  const contact = readMeta(meta.contactMetadata)
  return {
    invoiceId:
      (typeof meta.invoiceId === 'string' ? meta.invoiceId : undefined) ||
      (typeof trigger.invoiceId === 'string' ? trigger.invoiceId : undefined) ||
      (typeof contact.invoiceId === 'string' ? contact.invoiceId : undefined),
    caseId:
      (typeof meta.caseId === 'string' ? meta.caseId : undefined) ||
      (typeof trigger.caseId === 'string' ? trigger.caseId : undefined) ||
      (typeof contact.caseId === 'string' ? contact.caseId : undefined),
    dealId:
      (typeof meta.dealId === 'string' ? meta.dealId : undefined) ||
      (typeof trigger.dealId === 'string' ? trigger.dealId : undefined) ||
      (typeof contact.dealId === 'string' ? contact.dealId : undefined),
  }
}
