/**
 * Quota Calculator Service
 * Calculates and tracks quotas vs actuals
 */

import { prisma } from '@/lib/db/prisma'

export class QuotaCalculatorService {
  /**
   * Create quota
   */
  static async createQuota(
    tenantId: string,
    data: {
      salesRepId?: string
      territoryId?: string
      period: 'monthly' | 'quarterly' | 'annual'
      periodStart: Date
      periodEnd: Date
      target: number
    }
  ) {
    if (!data.salesRepId && !data.territoryId) {
      throw new Error('Either salesRepId or territoryId must be provided')
    }

    return prisma.quota.create({
      data: {
        tenantId,
        salesRepId: data.salesRepId,
        territoryId: data.territoryId,
        period: data.period,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        target: data.target,
        actual: 0,
      },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
        territory: true,
      },
    })
  }

  /**
   * Update quota actuals from deals
   */
  static async updateQuotaActuals(tenantId: string, quotaId: string) {
    const quota = await prisma.quota.findFirst({
      where: { id: quotaId, tenantId },
    })

    if (!quota) {
      throw new Error('Quota not found')
    }

    // Calculate actual revenue from closed deals
    const whereClause: any = {
      tenantId,
      actualCloseDate: {
        gte: quota.periodStart,
        lte: quota.periodEnd,
      },
      stage: 'won', // Assuming 'won' is the closed stage
    }

    if (quota.salesRepId) {
      whereClause.assignedToId = quota.salesRepId
    }

    if (quota.territoryId) {
      // Get all reps in territory
      const territory = await prisma.territory.findUnique({
        where: { id: quota.territoryId },
        include: { assignedReps: true },
      })

      if (territory) {
        const repIds = territory.assignedReps.map((a) => a.salesRepId)
        whereClause.assignedToId = { in: repIds }
      }
    }

    const closedDeals = await prisma.deal.findMany({
      where: whereClause,
      select: {
        value: true,
      },
    })

    const actual = closedDeals.reduce((sum, deal) => sum + deal.value, 0)

    return prisma.quota.update({
      where: { id: quotaId },
      data: { actual },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
        territory: true,
      },
    })
  }

  /**
   * Get quota performance
   */
  static async getQuotaPerformance(
    tenantId: string,
    filters?: {
      salesRepId?: string
      territoryId?: string
      period?: 'monthly' | 'quarterly' | 'annual'
    }
  ) {
    const quotas = await prisma.quota.findMany({
      where: {
        tenantId,
        ...(filters?.salesRepId && { salesRepId: filters.salesRepId }),
        ...(filters?.territoryId && { territoryId: filters.territoryId }),
        ...(filters?.period && { period: filters.period }),
      },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
        territory: true,
      },
      orderBy: { periodStart: 'desc' },
    })

    return quotas.map((quota) => ({
      ...quota,
      performance: {
        percentage: quota.target > 0 ? (quota.actual / quota.target) * 100 : 0,
        remaining: quota.target - quota.actual,
        overUnder: quota.actual - quota.target,
      },
    }))
  }

  /**
   * Get quota by ID
   */
  static async getQuota(tenantId: string, quotaId: string) {
    const quota = await prisma.quota.findFirst({
      where: { id: quotaId, tenantId },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
        territory: true,
      },
    })

    if (!quota) {
      return null
    }

    return {
      ...quota,
      performance: {
        percentage: quota.target > 0 ? (quota.actual / quota.target) * 100 : 0,
        remaining: quota.target - quota.actual,
        overUnder: quota.actual - quota.target,
      },
    }
  }

  /**
   * List quotas
   */
  static async listQuotas(
    tenantId: string,
    filters?: {
      salesRepId?: string
      territoryId?: string
      period?: 'monthly' | 'quarterly' | 'annual'
    }
  ) {
    return prisma.quota.findMany({
      where: {
        tenantId,
        ...(filters?.salesRepId && { salesRepId: filters.salesRepId }),
        ...(filters?.territoryId && { territoryId: filters.territoryId }),
        ...(filters?.period && { period: filters.period }),
      },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
        territory: true,
      },
      orderBy: { periodStart: 'desc' },
    })
  }

  /**
   * Delete quota
   */
  static async deleteQuota(tenantId: string, quotaId: string) {
    const quota = await prisma.quota.findFirst({
      where: { id: quotaId, tenantId },
    })

    if (!quota) {
      throw new Error('Quota not found')
    }

    return prisma.quota.delete({
      where: { id: quotaId },
    })
  }
}
