import { z } from 'zod'

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
   */
  primaryStrategy: z.enum(['territory_then_smart', 'territory', 'smart']),
  /** If no strategy matches, assign to this SalesRep id when valid for the tenant. */
  fallbackSalesRepId: z.string().nullable().optional(),
  /** Optional: map normalized inbound sourceChannel (lowercase) to a SalesRep id. */
  sourceChannelToSalesRepId: z.record(z.string(), z.string()).optional(),
})

export type LeadRoutingConfigV1 = z.infer<typeof LeadRoutingConfigV1Schema>

export const DEFAULT_LEAD_ROUTING_CONFIG_V1: LeadRoutingConfigV1 = {
  version: 1,
  enabled: false,
  primaryStrategy: 'territory_then_smart',
  fallbackSalesRepId: null,
  sourceChannelToSalesRepId: {},
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
  const srcMap = o.sourceChannelToSalesRepId
  const mergedChannels =
    srcMap !== null &&
    typeof srcMap === 'object' &&
    !Array.isArray(srcMap) &&
    Object.keys(srcMap).every((k) => typeof (srcMap as Record<string, unknown>)[k] === 'string')
      ? { ...DEFAULT_LEAD_ROUTING_CONFIG_V1.sourceChannelToSalesRepId, ...(srcMap as Record<string, string>) }
      : { ...DEFAULT_LEAD_ROUTING_CONFIG_V1.sourceChannelToSalesRepId }

  const candidate = {
    ...DEFAULT_LEAD_ROUTING_CONFIG_V1,
    ...o,
    version: 1 as const,
    sourceChannelToSalesRepId: mergedChannels,
  }
  const parsed = LeadRoutingConfigV1Schema.safeParse(candidate)
  return parsed.success ? parsed.data : { ...DEFAULT_LEAD_ROUTING_CONFIG_V1 }
}
