import { prisma } from '@/lib/db/prisma'
import { coerceLeadRoutingConfigV1, type LeadRoutingConfigV1 } from './config-schema'

export async function loadLeadRoutingConfig(tenantId: string): Promise<LeadRoutingConfigV1 | null> {
  const row = await prisma.crmConfig.findUnique({
    where: { tenantId },
    select: { leadRouting: true },
  })
  if (!row || row.leadRouting == null) return null
  return coerceLeadRoutingConfigV1(row.leadRouting)
}
