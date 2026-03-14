import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/competitors/track - Get tracked competitors
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitors = await prisma.competitor.findMany({
      where: { tenantId },
      include: {
        prices: {
          orderBy: { lastCheckedAt: 'desc' },
          take: 5,
        },
        locations: {
          where: { isActive: true },
        },
        alerts: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            prices: true,
            locations: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ competitors })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get competitors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

// POST /api/competitors/track - Add competitor to track
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const { name, website, industry, description, priceTrackingEnabled, locationTrackingEnabled } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Competitor name is required' },
        { status: 400 }
      )
    }

    const competitor = await prisma.competitor.create({
      data: {
        tenantId,
        name,
        website,
        industry,
        description,
        priceTrackingEnabled: priceTrackingEnabled || false,
        locationTrackingEnabled: locationTrackingEnabled || false,
      },
      include: {
        prices: true,
        locations: true,
        alerts: true,
      },
    })

    return NextResponse.json({ competitor }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Track competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to track competitor' },
      { status: 500 }
    )
  }
}
