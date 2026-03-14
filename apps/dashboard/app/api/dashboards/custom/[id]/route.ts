import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const dashboardSchema = z.object({
  name: z.string().min(1).optional(),
  widgets: z.array(z.any()).optional(),
})

/**
 * GET /api/dashboards/custom/[id]
 * Get a custom dashboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const dashboard = await prisma.customReport.findFirst({
      where: {
        id: params.id,
        tenantId,
        reportType: 'custom_dashboard',
      },
    })

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/dashboards/custom/[id]
 * Update a custom dashboard
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = dashboardSchema.parse(body)

    const dashboard = await prisma.customReport.findFirst({
      where: {
        id: params.id,
        tenantId,
        reportType: 'custom_dashboard',
      },
    })

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    const filters = dashboard.filters as any
    const updated = await prisma.customReport.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        filters: validated.widgets
          ? {
              ...(filters || {}),
              widgets: validated.widgets,
            } as any
          : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dashboards/custom/[id]
 * Delete a custom dashboard
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const dashboard = await prisma.customReport.findFirst({
      where: {
        id: params.id,
        tenantId,
        reportType: 'custom_dashboard',
      },
    })

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    await prisma.customReport.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Dashboard deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
}
