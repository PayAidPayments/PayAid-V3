/**
 * Job Scheduler
 * 
 * Schedules periodic background jobs:
 * - Cache warming (every hour)
 * - Report generation (scheduled)
 * - Data synchronization (daily)
 */

import { lowPriorityQueue } from '@/lib/queue/bull'
import { prisma } from '@/lib/db/prisma'

/**
 * Schedule cache warming for all active tenants
 * Runs every hour
 */
export async function scheduleCacheWarming() {
  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
      },
    })

    // Schedule cache warming for each tenant
    for (const tenant of tenants) {
      await lowPriorityQueue.add(
        'warm-cache',
        { tenantId: tenant.id },
        {
          jobId: `warm-cache-${tenant.id}-${Date.now()}`,
          removeOnComplete: true,
        }
      )
    }

    console.log(`[Scheduler] Scheduled cache warming for ${tenants.length} tenants`)
  } catch (error) {
    console.error('[Scheduler] Failed to schedule cache warming:', error)
  }
}

/**
 * Schedule periodic cache warming
 * Call this on application startup to set up recurring jobs
 */
export function startCacheWarmingScheduler() {
  // Schedule immediately
  scheduleCacheWarming()

  // Then schedule every hour
  setInterval(() => {
    scheduleCacheWarming()
  }, 60 * 60 * 1000) // 1 hour

  console.log('✅ Cache warming scheduler started (runs every hour)')
}

/**
 * Schedule report generation for a tenant
 */
export async function scheduleReportGeneration(
  reportType: string,
  tenantId: string,
  userId: string,
  params: Record<string, any>
) {
  await lowPriorityQueue.add(
    'generate-report',
    {
      reportType,
      tenantId,
      userId,
      params,
    },
    {
      attempts: 1,
      removeOnComplete: true,
    }
  )
}

/**
 * Schedule data synchronization
 */
export async function scheduleDataSync(
  syncType: string,
  tenantId: string,
  data: Record<string, any>
) {
  await lowPriorityQueue.add(
    'sync-data',
    {
      syncType,
      tenantId,
      data,
    },
    {
      attempts: 2,
      removeOnComplete: true,
    }
  )
}
