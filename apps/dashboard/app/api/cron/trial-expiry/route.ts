import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/cron/trial-expiry
 * Marks expired trial tenants as payment_required and freezes trial module rows.
 *
 * Security:
 * - Set CRON_SECRET and call with Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const expiredTenants = await prisma.tenant.findMany({
      where: {
        billingStatus: 'trialing',
        trialEndsAt: { lte: now },
      },
      select: {
        id: true,
        trialEndsAt: true,
      },
    })

    let tenantsUpdated = 0
    let modulesUpdated = 0

    for (const tenant of expiredTenants) {
      await prisma.$transaction(async (tx) => {
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { billingStatus: 'payment_required' },
        })
        tenantsUpdated++

        const updateResult = await tx.moduleLicense.updateMany({
          where: {
            tenantId: tenant.id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        })
        modulesUpdated += updateResult.count
      })
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      expiredTenantCount: expiredTenants.length,
      tenantsUpdated,
      modulesUpdated,
    })
  } catch (error) {
    console.error('Trial expiry cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process trial expiries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

