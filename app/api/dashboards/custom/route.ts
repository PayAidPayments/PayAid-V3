import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const dashboardSchema = z.object({
  name: z.string().min(1),
  widgets: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['metric', 'chart', 'list', 'table', 'kanban']),
      title: z.string(),
      config: z.record(z.any()),
      position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    })
  ),
})

/**
 * POST /api/dashboards/custom
 * Create a custom dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = dashboardSchema.parse(body)

    // Store dashboard configuration (would be in a CustomDashboard model)
    // For now, store in a JSON field or create a model
    const dashboard = await prisma.customReport.create({
      data: {
        tenantId,
        name: validated.name,
        type: 'custom_dashboard',
        config: {
          widgets: validated.widgets,
        },
        createdById: userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: dashboard,
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

    console.error('Create dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dashboards/custom
 * List custom dashboards
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const dashboards = await prisma.customReport.findMany({
      where: {
        tenantId,
        type: 'custom_dashboard',
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: dashboards,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List dashboards error:', error)
    return NextResponse.json(
      { error: 'Failed to list dashboards' },
      { status: 500 }
    )
  }
}
