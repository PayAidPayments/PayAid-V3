import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  layoutJson: z.record(z.any()),
  widgets: z.array(z.record(z.any())),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/dashboards/custom - List custom dashboards
export async function GET(request: NextRequest) {
  try {
    // Check analytics module license
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const dashboards = await prisma.customDashboard.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ dashboards })
  } catch (error) {
    console.error('Get custom dashboards error:', error)
    return NextResponse.json(
      { error: 'Failed to get custom dashboards' },
      { status: 500 }
    )
  }
}

// POST /api/dashboards/custom - Create custom dashboard
export async function POST(request: NextRequest) {
  try {
    // Check analytics module license
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createDashboardSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.customDashboard.updateMany({
        where: {
          tenantId: tenantId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const dashboard = await prisma.customDashboard.create({
      data: {
        name: validated.name,
        description: validated.description,
        layoutJson: validated.layoutJson,
        widgets: validated.widgets,
        isDefault: validated.isDefault ?? false,
        isPublic: validated.isPublic ?? false,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(dashboard, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create custom dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to create custom dashboard' },
      { status: 500 }
    )
  }
}
