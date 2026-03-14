import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/competitors/[id] - Get competitor details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        prices: {
          orderBy: { lastCheckedAt: 'desc' },
        },
        locations: {
          orderBy: { createdAt: 'desc' },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ competitor })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitor' },
      { status: 500 }
    )
  }
}

// PATCH /api/competitors/[id] - Update competitor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const { name, website, industry, description, monitoringEnabled, priceTrackingEnabled, locationTrackingEnabled, isActive } = body

    const competitor = await prisma.competitor.updateMany({
      where: {
        id: params.id,
        tenantId,
      },
      data: {
        ...(name && { name }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(description !== undefined && { description }),
        ...(monitoringEnabled !== undefined && { monitoringEnabled }),
        ...(priceTrackingEnabled !== undefined && { priceTrackingEnabled }),
        ...(locationTrackingEnabled !== undefined && { locationTrackingEnabled }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    if (competitor.count === 0) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.competitor.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({ competitor: updated })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    )
  }
}

// DELETE /api/competitors/[id] - Delete competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    await prisma.competitor.deleteMany({
      where: {
        id: params.id,
        tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}

