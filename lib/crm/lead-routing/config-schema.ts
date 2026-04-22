import { z } from 'zod'

/**
 * Pilot wedge: SLA + first task + explicit round-robin pool only (keep small; no config sprawl).
 * Routing strategy stays on `primaryStrategy` (adds `round_robin`); pool lives here.
 */
export const PilotInboundConfigV1Schema = z.object({
  /** Calendar-time SLA from intake; used with routing decision + optional Contact.nextFollowUp. */
  firstResponseSlaMinutes: z.number().int().positive().max(10080).optional(),
  /** SalesRep ids in rotation order; used when `primaryStrategy === 'round_robin'`. Fair cursor → DB later. */
  roundRobinPoolSalesRepIds: z.array(z.string()).max(100).optional(),
  /** When true, orchestration creates one CRM Task for first follow-up (pilot contract). */
  guaranteeFirstFollowUpTask: z.boolean().optional(),
  /** Default title for that task. */
  firstFollowUpTitle: z.string().min(1).max(200).optional(),
})

export type PilotInboundConfigV1 = z.infer<typeof PilotInboundConfigV1Schema>

/** Stored on CRMConfig.leadRouting (JSON). */
export const LeadRoutingConfigV1Schema = z.object({
  version: z.literal(1),
  /** When false, inbound leads are not auto-assigned unless explicit owner is set. */
  enabled: z.boolean(),
  /**
   * How to pick a rep when the lead is still unassigned:
   * - territory_then_smart: territory match first, then smart allocation
   * - territory: territory only
   * - smart: workload / specialization / conversion heuristic only
   * - round_robin: use `pilotInbound.roundRobinPoolSalesRepIds` (see resolve-inbound-assignment)
   */
  primaryStrategy: z.enum(['territory_then_smart', 'territory', 'smart', 'round_robin']),
  /** If no strategy matches, assign to this SalesRep id when valid for the tenant. */
  fallbackSalesRepId: z.string().nullable().optional(),
  /** Optional: map normalized inbound sourceChannel (lowercase) to a SalesRep id. */
  sourceChannelToSalesRepId: z.record(z.string(), z.string()).optional(),
  /** Optional pilot-only inbound SLA / first-task / round-robin pool (additive JSON). */
  pilotInbound: PilotInboundConfigV1Schema.optional(),
})

export type LeadRoutingConfigV1 = z.infer<typeof LeadRoutingConfigV1Schema>

export const DEFAULT_LEAD_ROUTING_CONFIG_V1: LeadRoutingConfigV1 = {
  version: 1,
  enabled: false,
  primaryStrategy: 'territory_then_smart',
  fallbackSalesRepId: null,
  sourceChannelToSalesRepId: {},
  pilotInbound: undefined,
}

export function parseLeadRoutingJson(raw: unknown): LeadRoutingConfigV1 | null {
  if (raw == null) return null
  const parsed = LeadRoutingConfigV1Schema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

/**
 * Merge API/DB payload with defaults so the settings UI never crashes on partial or older shapes.
 */
export function coerceLeadRoutingConfigV1(raw: unknown): LeadRoutingConfigV1 {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_LEAD_ROUTING_CONFIG_V1 }
  }
  const o = raw as Record<string, unknown>
  const { pilotInbound: _rawPilotIgnored, ...oRest } = o
  const srcMap = o.sourceChannelToSalesRepId
  const mergedChannels =
    srcMap !== null &&
    typeof srcMap === 'object' &&
    !Array.isArray(srcMap) &&
    Object.keys(srcMap).every((k) => typeof (srcMap as Record<string, unknown>)[k] === 'string')
      ? { ...DEFAULT_LEAD_ROUTING_CONFIG_V1.sourceChannelToSalesRepId, ...(srcMap as Record<string, string>) }
      : { ...DEFAULT_LEAD_ROUTING_CONFIG_V1.sourceChannelToSalesRepId }

  let pilotInbound: PilotInboundConfigV1 | undefined
  const rawPilot = o.pilotInbound
  if (rawPilot != null && typeof rawPilot === 'object' && !Array.isArray(rawPilot)) {
    const parsedPilot = PilotInboundConfigV1Schema.safeParse(rawPilot)
    pilotInbound = parsedPilot.success ? parsedPilot.data : undefined
  }

  const candidate = {
    ...DEFAULT_LEAD_ROUTING_CONFIG_V1,
    ...oRest,
    version: 1 as const,
    sourceChannelToSalesRepId: mergedChannels,
    ...(pilotInbound !== undefined ? { pilotInbound } : {}),
  }
  const parsed = LeadRoutingConfigV1Schema.safeParse(candidate)
  return parsed.success ? parsed.data : { ...DEFAULT_LEAD_ROUTING_CONFIG_V1 }
}
