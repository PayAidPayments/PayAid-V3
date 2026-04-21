import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

interface PilotPostPersistInput {
  tenantId: string
  contactId: string
  sourceChannel: string
  selectedSalesRepId: string | null
  routingReason: string
  routingDetail?: Record<string, unknown>
}

interface PilotPostPersistOptions {
  skipPilotArtifacts?: boolean
}

interface InboundIdempotencyInput {
  tenantId: string
  fingerprint: string
  contactId: string
}

interface InboundIdempotencyLookupInput {
  tenantId: string
  fingerprint: string
}

export async function findInboundIdempotentContact({
  tenantId,
  fingerprint,
}: InboundIdempotencyLookupInput): Promise<{ id: string } | null> {
  const normalized = fingerprint.trim()
  if (!normalized) return null

  const existing = await prisma.inboundIngressIdempotency.findUnique({
    where: {
      tenantId_fingerprint: {
        tenantId,
        fingerprint: normalized,
      },
    },
    select: { contactId: true },
  })

  return existing ? { id: existing.contactId } : null
}

export async function recordInboundIdempotency({
  tenantId,
  fingerprint,
  contactId,
}: InboundIdempotencyInput): Promise<void> {
  const normalized = fingerprint.trim()
  if (!normalized) return

  await prisma.inboundIngressIdempotency.upsert({
    where: {
      tenantId_fingerprint: {
        tenantId,
        fingerprint: normalized,
      },
    },
    update: {
      contactId,
    },
    create: {
      tenantId,
      fingerprint: normalized,
      contactId,
    },
  })
}

function getFirstResponseDueDate(sourceChannel: string): Date {
  const normalized = sourceChannel.trim().toLowerCase()
  const now = Date.now()
  const quickChannels = new Set(['whatsapp', 'chatbot', 'live-chat', 'chat'])
  const dueInMs = quickChannels.has(normalized) ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000
  return new Date(now + dueInMs)
}

async function createFirstFollowUpTask(input: PilotPostPersistInput): Promise<string | null> {
  if (!input.selectedSalesRepId) return null

  const task = await prisma.task.create({
    data: {
      tenantId: input.tenantId,
      contactId: input.contactId,
      assignedToId: input.selectedSalesRepId,
      module: 'crm',
      title: `Follow up inbound lead (${input.sourceChannel})`,
      description:
        'Auto-created from inbound orchestration to ensure first response SLA is tracked.',
      priority: 'high',
      status: 'pending',
      dueDate: getFirstResponseDueDate(input.sourceChannel),
    },
    select: { id: true },
  })

  return task.id
}

export async function applyInboundPilotArtifacts(
  input: PilotPostPersistInput,
  options: PilotPostPersistOptions = {}
): Promise<void> {
  if (options.skipPilotArtifacts === true) return

  const firstFollowUpTaskId = await createFirstFollowUpTask(input)
  const slaDueAt = getFirstResponseDueDate(input.sourceChannel)

  await prisma.inboundRoutingDecision.create({
    data: {
      tenantId: input.tenantId,
      contactId: input.contactId,
      sourceChannel: input.sourceChannel,
      selectedSalesRepId: input.selectedSalesRepId,
      routingReason: input.routingReason,
      routingDetail: (input.routingDetail ?? undefined) as Prisma.InputJsonValue | undefined,
      slaFirstResponseDueAt: slaDueAt,
      firstFollowUpTaskId,
    },
  })
}

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { loadLeadRoutingConfig } from '@/lib/crm/lead-routing'

export interface PilotPostPersistParams {
  tenantId: string
  contactId: string
  sourceChannel: string
  selectedSalesRepId: string | null
  routingReason: string
  routingDetail?: Record<string, unknown>
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000)
}

/**
 * Pilot loop: SLA stamp on contact, durable routing decision row, optional guaranteed first CRM Task.
 * Skipped for bulk paths via `skipPilotArtifacts` in caller.
 */
export async function applyInboundPilotArtifacts(
  params: PilotPostPersistParams,
  options: { skipPilotArtifacts: boolean }
): Promise<void> {
  if (options.skipPilotArtifacts) return

  const cfg = await loadLeadRoutingConfig(params.tenantId)
  const pilot = cfg?.pilotInbound
  const slaMinutes = pilot?.firstResponseSlaMinutes
  const guaranteeTask = Boolean(pilot?.guaranteeFirstFollowUpTask)
  const taskTitle = pilot?.firstFollowUpTitle?.trim() || 'Follow up: inbound lead'

  const now = new Date()
  const slaDue =
    typeof slaMinutes === 'number' && slaMinutes > 0 ? addMinutes(now, slaMinutes) : null

  if (slaDue) {
    await prisma.contact.update({
      where: { id: params.contactId },
      data: { nextFollowUp: slaDue },
    })
  }

  let firstFollowUpTaskId: string | null = null

  if (guaranteeTask) {
    try {
      let assignUserId: string | null = null
      if (params.selectedSalesRepId) {
        const rep = await prisma.salesRep.findFirst({
          where: { id: params.selectedSalesRepId, tenantId: params.tenantId },
          select: { userId: true },
        })
        assignUserId = rep?.userId ?? null
      }

      const dueDate = slaDue ?? addMinutes(now, 24 * 60)

      const task = await prisma.task.create({
        data: {
          tenantId: params.tenantId,
          title: taskTitle,
          description: `Pilot first touch (${params.sourceChannel}).`,
          priority: 'high',
          status: 'pending',
          dueDate,
          module: 'crm',
          contactId: params.contactId,
          assignedToId: assignUserId,
        },
      })
      firstFollowUpTaskId = task.id
    } catch (taskErr) {
      console.error('[inbound-pilot] first follow-up task create failed:', taskErr)
    }
  }

  const decisionData = {
    tenantId: params.tenantId,
    contactId: params.contactId,
    sourceChannel: params.sourceChannel,
    routingReason: params.routingReason,
    selectedSalesRepId: params.selectedSalesRepId,
    routingDetail: (params.routingDetail ?? null) as Prisma.InputJsonValue,
    slaFirstResponseDueAt: slaDue,
    firstFollowUpTaskId,
  }

  let decisionWritten = false
  let lastDecisionErr: unknown
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await prisma.inboundRoutingDecision.create({ data: decisionData })
      decisionWritten = true
      break
    } catch (decisionErr) {
      lastDecisionErr = decisionErr
      console.error(`[inbound-pilot] inboundRoutingDecision create failed (attempt ${attempt}):`, decisionErr)
    }
  }
  if (!decisionWritten && lastDecisionErr) {
    throw lastDecisionErr
  }
}

export async function recordInboundIdempotency(params: {
  tenantId: string
  fingerprint: string
  contactId: string
}): Promise<void> {
  try {
    await prisma.inboundIngressIdempotency.create({
      data: {
        tenantId: params.tenantId,
        fingerprint: params.fingerprint,
        contactId: params.contactId,
      },
    })
  } catch (e: unknown) {
    const code = typeof e === 'object' && e && 'code' in e ? (e as { code?: string }).code : undefined
    if (code === 'P2002') return
    throw e
  }
}

export async function findInboundIdempotentContact(params: {
  tenantId: string
  fingerprint: string
}): Promise<{ id: string } | null> {
  const row = await prisma.inboundIngressIdempotency.findUnique({
    where: {
      tenantId_fingerprint: { tenantId: params.tenantId, fingerprint: params.fingerprint },
    },
    select: { contactId: true },
  })
  if (!row) return null
  return { id: row.contactId }
}
