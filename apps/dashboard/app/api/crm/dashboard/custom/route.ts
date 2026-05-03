import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/crm/dashboard/custom
 * Get custom dashboard layout
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const customDashboard = await prisma.customReport.findFirst({
      where: {
        tenantId,
        reportType: 'custom_dashboard',
      },
    })

    if (customDashboard) {
      // Map filters/columns to widgets/layout structure
      const filters = customDashboard.filters as any
      return NextResponse.json({
        widgets: filters?.widgets || [],
        layout: filters?.layout || {},
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
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { widgets, layout } = body

    // Store widgets/layout in filters JSON field
    await prisma.customReport.upsert({
      where: {
        id: `dashboard-${tenantId}-${userId || 'default'}`,
      },
      update: {
        filters: { widgets, layout } as any,
        updatedAt: new Date(),
      },
      create: {
        id: `dashboard-${tenantId}-${userId || 'default'}`,
        tenantId,
        name: 'Custom Dashboard',
        reportType: 'custom_dashboard',
        filters: { widgets, layout } as any,
        columns: [],
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
