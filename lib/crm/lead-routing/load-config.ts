import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { coerceLeadRoutingConfigV1, type LeadRoutingConfigV1 } from './config-schema'

export async function loadLeadRoutingConfig(tenantId: string): Promise<LeadRoutingConfigV1 | null> {
  try {
    const row = await prisma.crmConfig.findUnique({
      where: { tenantId },
      select: { leadRouting: true },
    })
    if (!row || row.leadRouting == null) return null
    return coerceLeadRoutingConfigV1(row.leadRouting)
  } catch (e) {
    // DB not migrated yet: CRMConfig.leadRouting column missing (Prisma P2022).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2022') {
      console.warn(
        '[lead-routing] CRMConfig.leadRouting missing; apply migration 20260419120000_crm_config_lead_routing (prisma migrate deploy).'
      )
      return null
    }
    throw e
  }
}
