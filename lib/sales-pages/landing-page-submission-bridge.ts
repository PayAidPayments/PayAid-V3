import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db/prisma'

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

function deriveChannel(attribution?: Record<string, unknown> | null): string {
  if (!attribution) return 'sales_page'
  const medium = String(attribution.medium || attribution.utm_medium || '').trim()
  const source = String(attribution.source || attribution.utm_source || '').trim()
  return medium || source || 'sales_page'
}

/**
 * Hosted-safe Sales Pages → CRM bridge (slim-deploy compatible).
 * Creates/merges Contact directly via Prisma + persists submissionLog on LandingPage.
 * Does not import inbound-orchestration/attribution graphs (missing on some deploy bases).
 */
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

  const attribution = {
    ...(input.attribution || {}),
    landingPageUrl:
      (input.attribution?.landingPageUrl as string | undefined) ?? `sales-page:${pageItem.slug}`,
    capturedAt: new Date().toISOString(),
  }

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
      const email = lead.email ? String(lead.email).trim().toLowerCase() : null
      const phone = lead.phone ? String(lead.phone).trim() : null
      let existing = null as { id: string; assignedToId: string | null; leadScore: number } | null
      if (email) {
        existing = await prisma.contact.findFirst({
          where: { tenantId: pageItem.tenantId, email },
          select: { id: true, assignedToId: true, leadScore: true },
        })
      }
      if (!existing && phone) {
        existing = await prisma.contact.findFirst({
          where: { tenantId: pageItem.tenantId, phone },
          select: { id: true, assignedToId: true, leadScore: true },
        })
      }

      if (existing) {
        const updated = await prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: lead.name,
            email: email ?? undefined,
            phone: phone ?? undefined,
            source: 'sales_page',
            attributionChannel: deriveChannel(attribution),
            lastContactedAt: new Date(),
            sourceData: {
              salesPageId: pageItem.id,
              formId: input.formId ?? null,
              attribution,
              ctaEvent: input.ctaEvent ?? null,
              bridge: 'landing-page-bridge-v2',
            },
          },
          select: { id: true, assignedToId: true, leadScore: true },
        })
        contactId = updated.id
        ownerId = updated.assignedToId
        leadScore = updated.leadScore
      } else {
        const created = await prisma.contact.create({
          data: {
            tenantId: pageItem.tenantId,
            name: lead.name,
            email,
            phone,
            type: 'lead',
            stage: 'prospect',
            status: 'active',
            source: 'sales_page',
            attributionChannel: deriveChannel(attribution),
            lastContactedAt: new Date(),
            sourceData: {
              salesPageId: pageItem.id,
              formId: input.formId ?? null,
              attribution,
              ctaEvent: input.ctaEvent ?? null,
              bridge: 'landing-page-bridge-v2',
            },
          },
          select: { id: true, assignedToId: true, leadScore: true },
        })
        contactId = created.id
        ownerId = created.assignedToId
        leadScore = created.leadScore
      }
      crmSyncStatus = 'crm_synced'
    } catch (e) {
      crmSyncStatus = 'failed'
      error = e instanceof Error ? e.message : 'CRM contact write failed'
    }
  }

  const entry: SalesSubmissionLogEntry = {
    id: input.existingEntryId || randomUUID(),
    submittedAt: new Date().toISOString(),
    formId: input.formId,
    payload: input.payload,
    attribution,
    ctaEvent: (input.ctaEvent as Record<string, unknown> | undefined) ?? null,
    crmSyncStatus,
    contactId,
    error,
    ownerId,
    leadScore,
  }

  const content = asRecord(pageItem.contentJson)
  if (input.existingEntryId) {
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
    await prisma.landingPage.update({
      where: { id: pageItem.id },
      data: {
        contentJson: {
          ...content,
          [LOG_KEY]: [entry, ...readLog(pageItem.contentJson)].slice(0, MAX_LOG),
        },
        conversions: { increment: 1 },
      },
    })
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
