import { prisma } from '@/lib/db/prisma'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { triggerWorkflowsByEvent } from '@/lib/workflow/trigger'
import { logCrmAudit } from '@/lib/audit-log-crm'
import type { Prisma } from '@prisma/client'
import type {
  InboundExecutionLogEntry,
  InboundSourceAttribution,
  ProcessInboundLeadInput,
  ProcessInboundLeadResult,
} from './types'
import {
  buildPayaidSourcePayload,
  computeInboundLeadScoreV1,
  normalizeInboundContactFields,
  normalizeSourceAttribution,
} from './source-normalize'

function pushLog(
  log: InboundExecutionLogEntry[],
  step: InboundExecutionLogEntry['step'],
  detail?: Record<string, unknown>
) {
  log.push(detail ? { step, detail } : { step })
}

async function findDuplicateContact(
  tenantId: string,
  email?: string | null,
  phone?: string | null
) {
  if (email) {
    const byEmail = await prisma.contact.findFirst({
      where: { tenantId, email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        stage: true,
        type: true,
        status: true,
        source: true,
        sourceData: true,
        accountId: true,
        assignedToId: true,
        leadScore: true,
        tags: true,
      },
    })
    if (byEmail) return { match: 'email' as const, contact: byEmail }
  }
  if (phone?.trim()) {
    const byPhone = await prisma.contact.findFirst({
      where: { tenantId, phone: phone.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        stage: true,
        type: true,
        status: true,
        source: true,
        sourceData: true,
        accountId: true,
        assignedToId: true,
        leadScore: true,
        tags: true,
      },
    })
    if (byPhone) return { match: 'phone' as const, contact: byPhone }
  }
  return null
}

async function resolveAccountId(
  tenantId: string,
  company: string | null | undefined
): Promise<string | null> {
  const name = company?.trim()
  if (!name) return null
  const account = await prisma.account.findFirst({
    where: {
      tenantId,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  })
  return account?.id ?? null
}

function mapExecutionLogStatus(result: ProcessInboundLeadResult): 'success' | 'rejected' | 'error' {
  if (result.ok) return 'success'
  if (
    result.error?.code === 'DUPLICATE_EMAIL' ||
    result.error?.code === 'DUPLICATE_PHONE'
  ) {
    return 'rejected'
  }
  return 'error'
}

async function finalizeInboundResult(
  input: ProcessInboundLeadInput,
  normalizedSource: InboundSourceAttribution,
  result: ProcessInboundLeadResult
): Promise<ProcessInboundLeadResult> {
  if (input.skipExecutionLogWrite === true) return result
  try {
    const contactId =
      result.contact.id && result.contact.id.length > 0 ? result.contact.id : null
    await prisma.inboundOrchestrationLog.create({
      data: {
        tenantId: input.tenantId,
        contactId,
        status: mapExecutionLogStatus(result),
        sourceChannel: normalizedSource.sourceChannel,
        dedupeAction: result.dedupeAction,
        leadScore: result.contact.leadScore,
        contactCreated: result.created,
        trace: result.executionLog as unknown as Prisma.InputJsonValue,
        errorCode: result.error?.code ?? null,
        errorMessage: result.error?.message ?? null,
        actorUserId: input.actorUserId,
      },
    })
  } catch (err) {
    console.error('[inbound-orchestration] execution log persist failed:', err)
  }
  return result
}

function contactRowFromResult(c: {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  stage: string | null
  type: string | null
  status: string | null
  source: string | null
  accountId: string | null
  assignedToId: string | null
  leadScore: number
}): ProcessInboundLeadResult['contact'] {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    stage: c.stage,
    type: c.type,
    status: c.status,
    source: c.source,
    accountId: c.accountId,
    assignedToId: c.assignedToId,
    leadScore: c.leadScore,
  }
}

/**
 * Single ingress pipeline for CRM contacts/leads from forms, chatbots, deals wizard, APIs, etc.
 * v1: normalize → dedupe → account match → score → persist → workflows → audit → cache.
 */
export async function processInboundLead(
  input: ProcessInboundLeadInput
): Promise<ProcessInboundLeadResult> {
  const executionLog: InboundExecutionLogEntry[] = []
  pushLog(executionLog, 'lead.received', { channel: input.source.sourceChannel })

  const normalizedSource = normalizeSourceAttribution(input.source)
  const contact = normalizeInboundContactFields(input.contact)
  const legacySource = (input.legacySourceLabel ?? normalizedSource.sourceChannel).trim()

  pushLog(executionLog, 'lead.normalized', {
    sourceChannel: normalizedSource.sourceChannel,
    hasEmail: Boolean(contact.email),
    hasPhone: Boolean(contact.phone),
  })

  const dup = await findDuplicateContact(input.tenantId, contact.email, contact.phone)
  if (dup && input.dedupePolicy === 'reject_duplicate') {
    pushLog(executionLog, 'lead.duplicate_rejected', { match: dup.match, existingId: dup.contact.id })
    return finalizeInboundResult(input, normalizedSource, {
      ok: false,
      contact: contactRowFromResult({
        ...dup.contact,
        leadScore: dup.contact.leadScore ?? 0,
      }),
      created: false,
      dedupeAction: 'rejected_duplicate',
      executionLog,
      error: {
        code: dup.match === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_PHONE',
        message:
          dup.match === 'email'
            ? 'A contact with this email already exists'
            : 'A contact with this phone number already exists',
        existingId: dup.contact.id,
      },
    })
  }

  if (dup && input.dedupePolicy === 'return_existing_without_update') {
    pushLog(executionLog, 'lead.persisted', { action: 'unchanged', id: dup.contact.id })
    return finalizeInboundResult(input, normalizedSource, {
      ok: true,
      contact: contactRowFromResult({
        ...dup.contact,
        leadScore: dup.contact.leadScore ?? 0,
      }),
      created: false,
      dedupeAction: 'unchanged',
      executionLog,
    })
  }

  let accountId: string | null =
    (dup?.contact.accountId as string | null) ?? (await resolveAccountId(input.tenantId, contact.company))
  pushLog(executionLog, 'lead.matched', {
    dedupe: dup ? 'found' : 'none',
    accountId: accountId ?? undefined,
  })

  const score = computeInboundLeadScoreV1(contact, normalizedSource.rawMetadata)
  pushLog(executionLog, 'lead.scored', { score })

  const assignedToId =
    contact.assignedToId !== undefined && contact.assignedToId !== null && contact.assignedToId !== ''
      ? contact.assignedToId
      : dup?.contact.assignedToId ?? null
  pushLog(executionLog, 'lead.assigned', {
    explicit: Boolean(contact.assignedToId),
    assignedToId: assignedToId ?? undefined,
  })

  const sourceData = buildPayaidSourcePayload(normalizedSource, dup?.contact.sourceData)

  const enforceLimits = input.enforceTenantLimits !== false
  const skipWorkflows = input.skipWorkflows === true
  const skipAudit = input.skipAudit === true
  const skipCache = input.skipCacheInvalidation === true

  const stage =
    contact.stage ??
    (contact.type === 'lead' ? 'prospect' : contact.type === 'customer' ? 'customer' : 'contact')

  if (dup && input.dedupePolicy === 'merge_existing') {
    const fillEmpty = input.mergeExistingFields === 'fill_empty_only'
    const mergedName = fillEmpty
      ? dup.contact.name?.trim() || contact.name?.trim() || 'Unknown'
      : contact.name?.trim() || dup.contact.name?.trim() || 'Unknown'
    const mergedEmail = fillEmpty
      ? dup.contact.email || contact.email
      : contact.email ?? dup.contact.email
    const mergedPhone = fillEmpty
      ? dup.contact.phone || contact.phone
      : contact.phone ?? dup.contact.phone
    const mergedCompany = fillEmpty
      ? dup.contact.company || contact.company
      : contact.company ?? dup.contact.company
    const tags = [...new Set([...(dup.contact.tags ?? []), ...(contact.tags ?? [])])]

    const updated = await prisma.contact.update({
      where: { id: dup.contact.id },
      data: {
        name: mergedName,
        email: mergedEmail,
        phone: mergedPhone,
        company: mergedCompany,
        source: legacySource || dup.contact.source,
        sourceData: sourceData as Prisma.InputJsonValue,
        accountId: accountId,
        assignedToId: assignedToId ?? dup.contact.assignedToId,
        leadScore: score,
        scoreUpdatedAt: new Date(),
        tags,
        ...(input.touchLastContactedAt ? { lastContactedAt: new Date() } : {}),
        ...(contact.notes ? { notes: contact.notes } : {}),
        ...(contact.internalNotes ? { internalNotes: contact.internalNotes } : {}),
        ...(contact.address ? { address: contact.address } : {}),
        ...(contact.city ? { city: contact.city } : {}),
        ...(contact.state ? { state: contact.state } : {}),
        ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
        ...(contact.country ? { country: contact.country } : {}),
        ...(contact.attributionChannel != null && contact.attributionChannel !== ''
          ? { attributionChannel: contact.attributionChannel }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        stage: true,
        type: true,
        status: true,
        source: true,
        accountId: true,
        assignedToId: true,
        leadScore: true,
      },
    })

    pushLog(executionLog, 'lead.persisted', { action: 'merged', id: updated.id })

    if (!skipAudit) {
      await logCrmAudit({
        tenantId: input.tenantId,
        userId: input.actorUserId,
        entityType: 'contact',
        entityId: updated.id,
        action: 'update',
        changeSummary: `Inbound merge (${normalizedSource.sourceChannel})`,
        afterSnapshot: {
          orchestration: executionLog,
          source: normalizedSource,
        },
      })
    }

    if (!skipWorkflows) {
      triggerWorkflowsByEvent({
        tenantId: input.tenantId,
        event: 'contact.updated',
        entity: 'contact',
        entityId: updated.id,
        data: {
          contact: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            company: updated.company,
          },
          inboundOrchestration: true,
          source: normalizedSource,
        },
      })
      pushLog(executionLog, 'lead.followup.started', { via: 'contact.updated' })
    }

    if (!skipCache) {
      await multiLayerCache.deletePattern(`contacts:${input.tenantId}:*`).catch(() => {})
      await multiLayerCache.delete(`dashboard:stats:${input.tenantId}`).catch(() => {})
    }

    return finalizeInboundResult(input, normalizedSource, {
      ok: true,
      contact: contactRowFromResult(updated),
      created: false,
      dedupeAction: 'merged',
      executionLog,
    })
  }

  // Create path
  if (enforceLimits) {
    const canCreate = await checkTenantLimits(input.tenantId, 'contacts')
    if (!canCreate) {
      pushLog(executionLog, 'lead.duplicate_rejected', { reason: 'contact_limit' })
      return finalizeInboundResult(input, normalizedSource, {
        ok: false,
        contact: contactRowFromResult({
          id: '',
          name: contact.name,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          company: contact.company ?? null,
          stage,
          type: contact.type ?? 'lead',
          status: contact.status ?? 'active',
          source: legacySource,
          accountId,
          assignedToId,
          leadScore: score,
        }),
        created: false,
        dedupeAction: 'rejected_duplicate',
        executionLog,
        error: {
          code: 'CONTACT_LIMIT',
          message: 'Contact limit reached. Please upgrade your plan.',
        },
      })
    }
  }

  const created = await prisma.contact.create({
    data: {
      tenantId: input.tenantId,
      name: contact.name,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      company: contact.company ?? undefined,
      type: contact.type ?? 'lead',
      stage,
      status: contact.status ?? 'active',
      source: legacySource,
      sourceData: sourceData as Prisma.InputJsonValue,
      accountId: accountId ?? undefined,
      assignedToId: assignedToId ?? undefined,
      leadScore: score,
      scoreUpdatedAt: new Date(),
      tags: contact.tags ?? [],
      notes: contact.notes ?? undefined,
      internalNotes: contact.internalNotes ?? undefined,
      address: contact.address ?? undefined,
      city: contact.city ?? undefined,
      state: contact.state ?? undefined,
      postalCode: contact.postalCode ?? undefined,
      country: contact.country ?? undefined,
      attributionChannel: contact.attributionChannel ?? undefined,
      ...(input.touchLastContactedAt ? { lastContactedAt: new Date() } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      stage: true,
      type: true,
      status: true,
      source: true,
      accountId: true,
      assignedToId: true,
      leadScore: true,
    },
  })

  pushLog(executionLog, 'lead.persisted', { action: 'created', id: created.id })

  if (!skipAudit) {
    await logCrmAudit({
      tenantId: input.tenantId,
      userId: input.actorUserId,
      entityType: 'contact',
      entityId: created.id,
      action: 'create',
      changeSummary: `Created contact: ${created.name} (${normalizedSource.sourceChannel})`,
      afterSnapshot: {
        name: created.name,
        email: created.email,
        stage: created.stage,
        orchestration: executionLog,
        source: normalizedSource,
      },
    })
  }

  if (!skipWorkflows) {
    triggerWorkflowsByEvent({
      tenantId: input.tenantId,
      event: 'contact.created',
      entity: 'contact',
      entityId: created.id,
      data: {
        contact: {
          id: created.id,
          name: created.name,
          email: created.email,
          phone: created.phone,
          company: created.company,
        },
        source: normalizedSource,
        legacySource,
      },
    })
    pushLog(executionLog, 'lead.followup.started', { via: 'contact.created' })
  }

  if (!skipCache) {
    await multiLayerCache.deletePattern(`contacts:${input.tenantId}:*`).catch(() => {})
    await multiLayerCache.delete(`dashboard:stats:${input.tenantId}`).catch(() => {})
  }

  return finalizeInboundResult(input, normalizedSource, {
    ok: true,
    contact: contactRowFromResult(created),
    created: true,
    dedupeAction: 'created',
    executionLog,
  })
}
