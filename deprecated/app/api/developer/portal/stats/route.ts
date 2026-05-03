import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/developer/portal/stats - Get developer portal statistics */
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId } = await requireModuleAccess(request, 'crm')

    // Get user's apps (assuming developerId is userId for now)
    const apps = await prisma.marketplaceApp.findMany({
      where: {
        developerId: userId,
      },
      include: {
        installations: true,
        reviews: {
          select: { rating: true },
        },
      },
    })

    const totalInstalls = apps.reduce((sum, app) => sum + app.installs, 0)
    const allRatings = apps.flatMap((app) => app.reviews.map((r) => r.rating))
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : null

    // Get API keys count (ApiKey uses orgId, not userId)
    const apiKeysCount = await prisma.apiKey.count({
      where: {
        orgId: tenantId,
      },
    })

    return NextResponse.json({
      appsCount: apps.length,
      totalInstalls,
      avgRating,
      apiKeysCount,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get stats' },
      { status: 500 }
    )
  }
}
