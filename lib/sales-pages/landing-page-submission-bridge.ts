import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import {
  INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
  processInboundLead,
} from '@/lib/crm/inbound-orchestration'
import { parseUtmAttribution, deriveAttributionChannel } from '@/lib/attribution/utm-contract'
import { utmToInboundSource } from '@/lib/attribution/touch-persistence'
export type SalesSubmissionCrmStatus = 'received' | 'normalized' | 'crm_synced' | 'failed'

export type SalesSubmissionLogEntry = {
  id: string
  submittedAt: string
  formId?: string
  payload: Record<string, unknown>
  attribution?: Record<string, unknown> | null
  ctaEvent?: Record<string, unknown> | null
  crmSyncStatus: SalesSubmissionCrmStatus
  contactId: string | null
  error?: string | null
  ownerId?: string | null
  leadScore?: number | null
}

const LOG_KEY = 'submissionLog'
const MAX_LOG = 100

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function extractLeadFromPayload(payload: Record<string, unknown>) {
  const email =
    (payload.email as string | undefined) ??
    (payload.Email as string | undefined) ??
    (payload.contactEmail as string | undefined)
  const name =
    (payload.name as string | undefined) ??
    (payload.fullName as string | undefined) ??
    (payload.Name as string | undefined)
  const phone = (payload.phone as string | undefined) ?? (payload.Phone as string | undefined)
  if (!email && !phone && !name) return null
  return { email, name: name || 'Unknown', phone }
}

function readLog(contentJson: unknown): SalesSubmissionLogEntry[] {
  const content = asRecord(contentJson)
  const raw = content[LOG_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter((row) => row && typeof row === 'object') as SalesSubmissionLogEntry[]
}

async function writeLog(pageId: string, contentJson: unknown, entry: SalesSubmissionLogEntry) {
  const content = asRecord(contentJson)
  const next = [entry, ...readLog(contentJson)].slice(0, MAX_LOG)
  await prisma.landingPage.update({
    where: { id: pageId },
    data: {
      contentJson: {
        ...content,
        [LOG_KEY]: next,
      },
      conversions: { increment: 1 },
    },
  })
  return next
}

export async function processSalesPageSubmission(input: {
  salesPageId: string
  formId?: string
  payload: Record<string, unknown>
  attribution?: Record<string, unknown>
  ctaEvent?: Record<string, unknown>
  existingEntryId?: string
}) {
  const pageItem = await prisma.landingPage.findFirst({
    where: { id: input.salesPageId, status: 'PUBLISHED' },
    select: { id: true, tenantId: true, slug: true, name: true, contentJson: true },
  })

  if (!pageItem) {
    return { ok: false as const, status: 404 as const, error: 'Published sales page not found' }
  }

  const attribution = parseUtmAttribution({
    ...(input.attribution || {}),
    landingPageUrl:
      (input.attribution?.landingPageUrl as string | undefined) ?? `sales-page:${pageItem.slug}`,
    capturedAt: new Date().toISOString(),
  })

  const lead = extractLeadFromPayload(input.payload)
  let contactId: string | null = null
  let ownerId: string | null = null
  let leadScore: number | null = null
  let crmSyncStatus: SalesSubmissionCrmStatus = 'received'
  let error: string | null = null

  if (!lead) {
    crmSyncStatus = 'failed'
    error = 'Submission payload missing name/email/phone'
  } else {
    try {
      const inboundSource = utmToInboundSource(attribution ?? {}, {
        sourceChannel: 'sales_page',
        sourceAsset: pageItem.id,
        sourceRef: input.formId,
        capturedBy: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
        rawMetadata: {
          utm: attribution,
          ctaEvent: input.ctaEvent,
          payload: input.payload,
        },
      })
      const inbound = await processInboundLead({
        tenantId: pageItem.tenantId,
        actorUserId: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
        dedupePolicy: 'merge_existing',
        mergeExistingFields: 'fill_empty_only',
        source: inboundSource,
        legacySourceLabel: 'sales_page',
        contact: {
          name: lead.name,
          email: lead.email ?? null,
          phone: lead.phone ?? null,
          type: 'lead',
          stage: 'prospect',
          status: 'active',
          attributionChannel: deriveAttributionChannel(attribution ?? {}),
        },
        touchLastContactedAt: true,
      })
      if (inbound.ok) {
        contactId = inbound.contact.id
        ownerId = inbound.contact.assignedToId ?? null
        leadScore = typeof inbound.contact.leadScore === 'number' ? inbound.contact.leadScore : null
        crmSyncStatus = 'crm_synced'
      } else {
        crmSyncStatus = 'failed'
        error =
          typeof inbound.error === 'string'
            ? inbound.error
            : inbound.error?.message || inbound.error?.code || 'Inbound orchestration failed'
      }
    } catch (e) {
      crmSyncStatus = 'failed'
      error = e instanceof Error ? e.message : 'Inbound orchestration threw'
    }
  }

  const entry: SalesSubmissionLogEntry = {
    id: input.existingEntryId || randomUUID(),
    submittedAt: new Date().toISOString(),
    formId: input.formId,
    payload: input.payload,
    attribution: attribution as Record<string, unknown> | null,
    ctaEvent: (input.ctaEvent as Record<string, unknown> | undefined) ?? null,
    crmSyncStatus,
    contactId,
    error,
    ownerId,
    leadScore,
  }

  // On retry, replace prior row; on fresh submit, prepend + bump conversions.
  if (input.existingEntryId) {
    const content = asRecord(pageItem.contentJson)
    const prior = readLog(pageItem.contentJson).filter((row) => row.id !== input.existingEntryId)
    await prisma.landingPage.update({
      where: { id: pageItem.id },
      data: {
        contentJson: {
          ...content,
          [LOG_KEY]: [entry, ...prior].slice(0, MAX_LOG),
        },
      },
    })
  } else {
    await writeLog(pageItem.id, pageItem.contentJson, entry)
  }

  return {
    ok: true as const,
    status: 202 as const,
    page: pageItem,
    entry,
    contactId,
    attributionPersisted: Boolean(attribution),
  }
}

export async function listSalesPageSubmissions(tenantId: string, opts?: { limit?: number; pageId?: string }) {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50))
  const pages = await prisma.landingPage.findMany({
    where: {
      tenantId,
      ...(opts?.pageId ? { id: opts.pageId } : {}),
    },
    select: { id: true, name: true, slug: true, contentJson: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  const rows = pages.flatMap((page) =>
    readLog(page.contentJson).map((entry) => ({
      ...entry,
      salesPageId: page.id,
      pageName: page.name,
      pageSlug: page.slug,
    }))
  )

  rows.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
  return rows.slice(0, limit)
}

export async function retrySalesPageSubmission(tenantId: string, entryId: string) {
  const pages = await prisma.landingPage.findMany({
    where: { tenantId },
    select: { id: true, contentJson: true, status: true },
    take: 100,
  })

  for (const page of pages) {
    const match = readLog(page.contentJson).find((row) => row.id === entryId)
    if (!match) continue
    if (page.status !== 'PUBLISHED') {
      return { ok: false as const, status: 400 as const, error: 'Sales page is not published' }
    }
    return processSalesPageSubmission({
      salesPageId: page.id,
      formId: match.formId,
      payload: match.payload || {},
      attribution: (match.attribution as Record<string, unknown> | undefined) || undefined,
      ctaEvent: (match.ctaEvent as Record<string, unknown> | undefined) || undefined,
      existingEntryId: match.id,
    })
  }

  return { ok: false as const, status: 404 as const, error: 'Submission not found' }
}
