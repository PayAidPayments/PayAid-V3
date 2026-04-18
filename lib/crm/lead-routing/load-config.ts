import { prisma } from '@/lib/db/prisma'
import { parseLeadRoutingJson, type LeadRoutingConfigV1 } from './config-schema'

export async function loadLeadRoutingConfig(tenantId: string): Promise<LeadRoutingConfigV1 | null> {
  const row = await prisma.crmConfig.findUnique({
    where: { tenantId },
    select: { leadRouting: true },
  })
  return parseLeadRoutingJson(row?.leadRouting ?? null)
}
