import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/data-governance/retention/log
 * Log data retention action
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const { entityType, entityId, action, reason } = body

    if (!entityType || !entityId || !action) {
      return NextResponse.json(
        { error: 'Entity type, entity ID, and action are required' },
        { status: 400 }
      )
    }

    const log = await prisma.dataRetentionLog.create({
      data: {
        tenantId,
        entityType,
        entityId,
        action,
        reason,
        performedBy: userId,
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Log data retention error:', error)
    return NextResponse.json(
      { error: 'Failed to log retention action' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/data-governance/retention/log
 * Get data retention logs
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')

    const where: any = { tenantId }
    if (entityType) {
      where.entityType = entityType
    }

    const logs = await prisma.dataRetentionLog.findMany({
      where,
      orderBy: { performedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get data retention logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

