import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

/**
 * GET /api/admin/check-dashboard-data
 * Checks if demo tenant has data for dashboard stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 401 }
      )
    }

    const tenantId = user.tenantId

    // Count data
    const [contacts, deals, tasks, leadSources] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.leadSource.count({ where: { tenantId } }),
    ])

    const hasData = contacts > 0 || deals > 0 || tasks > 0

    return NextResponse.json({
      hasData,
      counts: {
        contacts,
        deals,
        tasks,
        leadSources,
      },
      message: hasData 
        ? 'Dashboard data exists. Stats should display correctly.'
        : 'No dashboard data found. Please seed demo data.',
      seedEndpoint: '/api/admin/seed-demo-data',
    })
  } catch (error: any) {
    console.error('[CHECK_DASHBOARD_DATA] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check dashboard data',
        message: error?.message,
      },
      { status: 500 }
    )
  }
}
