/**
 * Lead Source ROI Tracking
 * Calculates conversion rates, average deal values, and ROI per source
 */

import { prisma } from '@/lib/db/prisma'

/**
 * Update lead source statistics
 */
export async function updateLeadSourceStats(sourceId: string) {
  const source = await prisma.leadSource.findUnique({
    where: { id: sourceId },
    include: {
      contacts: {
        include: {
          deals: true,
        },
      },
    },
  })

  if (!source) {
    throw new Error('Lead source not found')
  }

  const contacts = source.contacts
  const leadsCount = contacts.length
  const deals = contacts.flatMap((c) => c.deals)
  const wonDeals = deals.filter((d) => d.stage === 'won')
  const conversionsCount = wonDeals.length
  const totalValue = wonDeals.reduce((sum, d) => sum + d.value, 0)
  const avgDealValue = conversionsCount > 0 ? totalValue / conversionsCount : 0
  const conversionRate = leadsCount > 0 ? conversionsCount / leadsCount : 0

  // ROI calculation (simplified - would need campaign cost data)
  // ROI = (Revenue - Cost) / Cost * 100
  // For now, we'll use a placeholder
  const roi = conversionRate * 200 // Simplified calculation

  await prisma.leadSource.update({
    where: { id: sourceId },
    data: {
      leadsCount,
      conversionsCount,
      totalValue,
      avgDealValue,
      conversionRate,
      roi,
    },
  })

  return {
    leadsCount,
    conversionsCount,
    totalValue,
    avgDealValue,
    conversionRate,
    roi,
  }
}

/**
 * Get all lead sources with ROI data
 */
export async function getLeadSourceROI(tenantId: string) {
  const sources = await prisma.leadSource.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          contacts: true,
        },
      },
    },
    orderBy: { totalValue: 'desc' },
  })

  // Recalculate stats for each source
  const sourcesWithStats = await Promise.all(
    sources.map(async (source) => {
      const stats = await updateLeadSourceStats(source.id)
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        ...stats,
      }
    })
  )

  return sourcesWithStats
}

/**
 * Create or update lead source from UTM parameters
 */
export async function createOrUpdateLeadSource(
  tenantId: string,
  sourceData: {
    name: string
    type: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }
) {
  // Try to find existing source
  let source = await prisma.leadSource.findFirst({
    where: {
      tenantId,
      name: sourceData.name,
      type: sourceData.type,
    },
  })

  if (!source) {
    // Create new source
    source = await prisma.leadSource.create({
      data: {
        tenantId,
        name: sourceData.name,
        type: sourceData.type,
      },
    })
  }

  return source
}
