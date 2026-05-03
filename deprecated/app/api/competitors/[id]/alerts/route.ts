import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/competitors/[id]/alerts - Get competitor alerts
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
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')

    const where: any = { competitorId: params.id }
    if (isRead !== null) {
      where.isRead = isRead === 'true'
    }
    if (type) {
      where.type = type
    }

    const alerts = await prisma.competitorAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get competitor alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// PATCH /api/competitors/[id]/alerts/[alertId] - Mark alert as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const alert = await prisma.competitorAlert.findFirst({
      where: {
        id: alertId,
        competitorId: params.id,
        competitor: {
          tenantId,
        },
      },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.competitorAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    })

    return NextResponse.json({ alert: updated })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update alert error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

