import { prisma } from '@/lib/db/prisma'
import { coerceLeadRoutingConfigV1, type LeadRoutingConfigV1 } from './config-schema'

/**
 * Load stored JSON from CRMConfig. Any DB/Prisma failure returns null so the UI can fall back to defaults
 * (migration drift, pooler timeouts, read URL issues, etc.).
 */
export async function loadLeadRoutingConfig(tenantId: string): Promise<LeadRoutingConfigV1 | null> {
  try {
    const row = await prisma.crmConfig.findUnique({
      where: { tenantId },
      select: { leadRouting: true },
    })
    if (!row || row.leadRouting == null) return null
    return coerceLeadRoutingConfigV1(row.leadRouting)
  } catch (e) {
    console.warn('[lead-routing] loadLeadRoutingConfig failed (using defaults in API):', e)
    return null
  }
}
