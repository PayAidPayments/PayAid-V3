/**
 * GET /api/admin/deals-count?tenantId=xxx
 * Returns deal count for a tenant. In development only, allows unauthenticated access
 * so scripts can verify data exists before opening the Deals page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const DEMO_TENANT_ID = 'cmjptk2mw0000aocw31u48n64'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId') || DEMO_TENANT_ID

    // In production, require auth; in development allow unauthenticated for script checks
    if (process.env.NODE_ENV === 'production') {
      const { authenticateRequest } = await import('@/lib/middleware/auth')
      const user = await authenticateRequest(request).catch(() => null)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const count = await prisma.deal.count({ where: { tenantId } })

    return NextResponse.json({
      tenantId,
      count,
      visibleOnDealsPage: count > 0,
      message:
        count > 0
          ? `${count} deal(s) exist. Open /crm/${tenantId}/Deals to view.`
          : 'No deals for this tenant. Seed demo data first.',
    })
  } catch (e) {
    console.error('[deals-count]', e)
    return NextResponse.json(
      { error: 'Failed to get deal count', message: (e as Error).message },
      { status: 500 }
    )
  }
}
