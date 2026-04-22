import type { Contact } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { autoAllocateLead } from '@/lib/sales-automation/lead-allocation'
import { LeadRouterService } from '@/lib/territories/lead-router'
import type { LeadRoutingConfigV1 } from './config-schema'

export interface InboundAssignmentContext {
  tenantId: string
  accountId: string | null
  /** Contact id to exclude when looking at siblings (merge target). */
  excludeContactId?: string | null
  sourceChannel: string
  name: string
  company: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  leadScore: number
}

async function findAccountSiblingAssignee(
  tenantId: string,
  accountId: string | null,
  excludeContactId?: string | null
): Promise<string | null> {
  if (!accountId) return null
  const sibling = await prisma.contact.findFirst({
    where: {
      tenantId,
      accountId,
      assignedToId: { not: null },
      ...(excludeContactId
        ? { id: { not: excludeContactId } }
        : {}),
    },
    select: { assignedToId: true },
    orderBy: { createdAt: 'desc' },
  })
  return sibling?.assignedToId ?? null
}

function draftContactForAllocation(ctx: InboundAssignmentContext): Contact {
  return {
    id: '__inbound_draft__',
    tenantId: ctx.tenantId,
    name: ctx.name,
    email: null,
    phone: null,
    company: ctx.company,
    type: 'lead',
    stage: 'prospect',
    status: 'active',
    source: ctx.sourceChannel,
    sourceId: null,
    sourceData: null,
    attributionChannel: null,
    address: null,
    city: ctx.city,
    state: ctx.state,
    postalCode: ctx.postalCode,
    country: 'India',
    gstin: null,
    likelyToBuy: null,
    churnRisk: null,
    leadScore: ctx.leadScore,
    scoreUpdatedAt: new Date(),
    scoreComponents: null,
    whatsappStatus: null,
    nurtureStage: null,
    predictedRevenue: null,
    tags: [],
    notes: null,
    internalNotes: null,
    createdAt: new Date(),
    lastContactedAt: null,
    nextFollowUp: null,
    assignedToId: null,
    accountId: ctx.accountId,
  } as unknown as Contact
}

async function validateRepId(tenantId: string, salesRepId: string): Promise<boolean> {
  const rep = await prisma.salesRep.findFirst({
    where: { id: salesRepId, tenantId },
    select: { id: true },
  })
  return Boolean(rep)
}

/**
 * Resolves SalesRep id for inbound orchestration when no explicit assignee is set.
 * Order: account sibling owner → source map (from config) → primary strategy → fallback rep.
 */
export async function resolveInboundSalesRepAssignment(
  config: LeadRoutingConfigV1 | null,
  ctx: InboundAssignmentContext
): Promise<{ salesRepId: string | null; reason: string; detail?: Record<string, unknown> }> {
  if (!config?.enabled) {
    return { salesRepId: null, reason: 'routing_disabled' }
  }

  const sibling = await findAccountSiblingAssignee(
    ctx.tenantId,
    ctx.accountId,
    ctx.excludeContactId ?? null
  )
  if (sibling) {
    return { salesRepId: sibling, reason: 'account_sibling_owner', detail: { accountId: ctx.accountId } }
  }

  const sourceKey = ctx.sourceChannel.trim().toLowerCase()
  const map = config.sourceChannelToSalesRepId ?? {}
  if (sourceKey && map[sourceKey]) {
    const rid = map[sourceKey]
    if (await validateRepId(ctx.tenantId, rid)) {
      return { salesRepId: rid, reason: 'source_channel_rule', detail: { sourceChannel: sourceKey } }
    }
  }

  const draft = draftContactForAllocation(ctx)
  const strategy = config.primaryStrategy

  /**
   * Pilot: deterministic rotation without a cursor table (fair under concurrency → add `LeadRoundRobinState` later).
   */
  const tryRoundRobin = async (): Promise<{
    salesRepId: string
    poolSize: number
    bucket: number
  } | null> => {
    const pool = config.pilotInbound?.roundRobinPoolSalesRepIds ?? []
    const validated: string[] = []
    for (const id of pool) {
      if (await validateRepId(ctx.tenantId, id)) validated.push(id)
    }
    if (validated.length === 0) return null
    const count = await prisma.contact.count({ where: { tenantId: ctx.tenantId } })
    const idx = count % validated.length
    const salesRepId = validated[idx]
    if (!salesRepId) return null
    return { salesRepId, poolSize: validated.length, bucket: idx }
  }

  const tryTerritory = async (): Promise<string | null> => {
    return LeadRouterService.routeLead(
      ctx.tenantId,
      {
        state: ctx.state || undefined,
        city: ctx.city || undefined,
        postalCode: ctx.postalCode || undefined,
        industry: ctx.company || undefined,
        company: ctx.company || undefined,
      },
      'territory-based'
    )
  }

  const trySmart = async (): Promise<string | null> => {
    try {
      const { bestRep } = await autoAllocateLead(draft, ctx.tenantId, {}, { syncDirectory: false })
      if (bestRep?.rep?.id && bestRep.score > -500) {
        return bestRep.rep.id
      }
    } catch {
      /* no reps */
    }
    return null
  }

  if (strategy === 'round_robin') {
    const rr = await tryRoundRobin()
    if (rr) {
      return {
        salesRepId: rr.salesRepId,
        reason: 'round_robin',
        detail: {
          poolSize: rr.poolSize,
          bucket: rr.bucket,
          note: 'pilot_modulo_contact_count',
        },
      }
    }
  } else if (strategy === 'territory') {
    const tid = await tryTerritory()
    if (tid) return { salesRepId: tid, reason: 'territory' }
  } else if (strategy === 'smart') {
    const sid = await trySmart()
    if (sid) return { salesRepId: sid, reason: 'smart_allocation' }
  } else {
    const tid = await tryTerritory()
    if (tid) return { salesRepId: tid, reason: 'territory_then_smart_territory' }
    const sid = await trySmart()
    if (sid) return { salesRepId: sid, reason: 'territory_then_smart_smart' }
  }

  if (config.fallbackSalesRepId) {
    if (await validateRepId(ctx.tenantId, config.fallbackSalesRepId)) {
      return {
        salesRepId: config.fallbackSalesRepId,
        reason: 'fallback_rep',
        detail: { salesRepId: config.fallbackSalesRepId },
      }
    }
  }

  return { salesRepId: null, reason: 'no_match' }
}
