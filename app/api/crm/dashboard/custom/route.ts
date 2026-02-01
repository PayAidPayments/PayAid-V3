import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/crm/dashboard/custom
 * Get custom dashboard layout
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, user } = await requireModuleAccess(request, 'crm')

    const customDashboard = await prisma.customReport.findFirst({
      where: {
        tenantId,
        type: 'custom_dashboard',
        createdById: user?.userId,
      },
    })

    if (customDashboard) {
      return NextResponse.json({
        widgets: customDashboard.config?.widgets || [],
        layout: customDashboard.config?.layout || {},
      })
    }

    return NextResponse.json({
      widgets: [],
      layout: {},
    })
  } catch (error: any) {
    console.error('Get custom dashboard error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/crm/dashboard/custom
 * Save custom dashboard layout
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { widgets, layout } = body

    await prisma.customReport.upsert({
      where: {
        id: `dashboard-${tenantId}-${user?.userId}`,
      },
      update: {
        config: { widgets, layout },
        updatedAt: new Date(),
      },
      create: {
        id: `dashboard-${tenantId}-${user?.userId}`,
        tenantId,
        name: 'Custom Dashboard',
        type: 'custom_dashboard',
        config: { widgets, layout },
        createdById: user?.userId,
        isPublic: false,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save custom dashboard error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to save dashboard configuration' },
      { status: 500 }
    )
  }
}
