import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/developer/portal/apps - Get developer's apps */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireModuleAccess(request, 'crm')

    const apps = await prisma.marketplaceApp.findMany({
      where: {
        developerId: userId,
      },
      include: {
        reviews: {
          select: { rating: true },
        },
        installations: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const appsWithStats = apps.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description,
      category: app.category,
      icon: app.icon,
      pricing: app.pricing,
      version: app.version,
      isApproved: app.isApproved,
      isActive: app.isActive,
      rating: app.reviews.length > 0
        ? app.reviews.reduce((sum, r) => sum + r.rating, 0) / app.reviews.length
        : null,
      installs: app.installs || app.installations.length,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }))

    return NextResponse.json(appsWithStats)
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get apps' },
      { status: 500 }
    )
  }
}
