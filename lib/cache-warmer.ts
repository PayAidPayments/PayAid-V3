/**
 * Cache Warming Service
 * Zero-cost enhancement for performance
 */

import { logger } from '@/lib/logging/structured-logger'
import { prisma } from '@/lib/db/prisma'

export class CacheWarmer {
  /**
   * Warm cache on login (preload frequently accessed data)
   */
  static async warmCacheOnLogin(tenantId: string, userId: string): Promise<void> {
    try {
      logger.info('Warming cache for user login', { tenantId, userId })

      // Preload common data in parallel
      await Promise.all([
        this.warmContacts(tenantId),
        this.warmDeals(tenantId),
        this.warmSegments(tenantId),
        this.warmPipeline(tenantId),
      ])

      logger.info('Cache warming complete', { tenantId, userId })
    } catch (error) {
      logger.error('Cache warming failed', error instanceof Error ? error : undefined, {
        tenantId,
        userId,
      })
    }
  }

  private static async warmContacts(tenantId: string): Promise<void> {
    try {
      await prisma.contact.findMany({
        where: { tenantId },
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true },
      })
    } catch (error) {
      // Ignore errors
    }
  }

  private static async warmDeals(tenantId: string): Promise<void> {
    try {
      await prisma.deal.findMany({
        where: { tenantId },
        take: 50,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, value: true, stage: true },
      })
    } catch (error) {
      // Ignore errors
    }
  }

  private static async warmSegments(tenantId: string): Promise<void> {
    try {
      await prisma.segment.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      })
    } catch (error) {
      // Ignore errors
    }
  }

  private static async warmPipeline(tenantId: string): Promise<void> {
    try {
      await prisma.deal.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: { id: true },
        _sum: { value: true },
      })
    } catch (error) {
      // Ignore errors
    }
  }
}
