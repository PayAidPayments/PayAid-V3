/**
 * Scheduled Job: Financial Dashboard Maintenance
 * 
 * Runs daily to:
 * - Sync transactions to GL
 * - Refresh materialized views
 * - Check alerts
 * - Compute variances
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { GLSyncService } from '@/lib/services/financial/gl-sync'
import { FinancialAlertSystem } from '@/lib/services/financial/alert-system'
import { VarianceDetectionService } from '@/lib/services/financial/variance-detection'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
        licensedModules: {
          has: 'finance',
        },
      },
    })

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    for (const tenant of tenants) {
      try {
        // Sync GL for current period
        const glSync = new GLSyncService(tenant.id)
        await glSync.syncPeriod(
          currentYear,
          currentMonth,
          new Date(currentYear, currentMonth - 1, 1),
          new Date(currentYear, currentMonth, 0)
        )

        // Check alerts
        const alertSystem = new FinancialAlertSystem(tenant.id)
        await alertSystem.checkAllAlerts()

        // Compute variances for current period
        const varianceService = new VarianceDetectionService(tenant.id)
        await varianceService.computePeriodVariance(currentYear, currentMonth)

        console.log(`✓ Processed tenant: ${tenant.id}`)
      } catch (error) {
        console.error(`Error processing tenant ${tenant.id}:`, error)
        // Continue with next tenant
      }
    }

    // Refresh materialized views
    await prisma.$executeRaw`SELECT refresh_all_financial_views()`

    return NextResponse.json({
      success: true,
      processed: tenants.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Financial Dashboard cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}
