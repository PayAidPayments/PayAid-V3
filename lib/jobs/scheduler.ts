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
import { addEmailCampaignDispatchJob } from '@/lib/queue/email-queue'

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
    // Redis/DB may be unavailable locally; log once without full stack
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[Scheduler] Cache warming unavailable:', msg)
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
 * Schedule due email campaigns for dispatch.
 * Runs every minute and enqueues campaigns with status=scheduled and scheduledFor<=now.
 */
export async function scheduleDueEmailCampaigns() {
  try {
    const now = new Date()
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        type: 'email',
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      select: {
        id: true,
        tenantId: true,
      },
      take: 200,
    })

    for (const campaign of dueCampaigns) {
      await addEmailCampaignDispatchJob(
        {
          campaignId: campaign.id,
          tenantId: campaign.tenantId,
          batchSize: 1000,
        },
        {
          jobId: `email-campaign-release-${campaign.id}`,
          removeOnComplete: true,
        }
      )
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[Scheduler] Email campaign release unavailable:', msg)
  }
}

export function startEmailCampaignScheduler() {
  scheduleDueEmailCampaigns()

  setInterval(() => {
    scheduleDueEmailCampaigns()
  }, 60 * 1000)

  console.log('✅ Email campaign scheduler started (runs every minute)')
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
