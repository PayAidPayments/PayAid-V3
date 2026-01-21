import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const fieldLayoutSchema = z.object({
  module: z.string(),
  entityType: z.string(),
  viewType: z.string(),
  layoutJson: z.any(), // JSON object
})

// GET /api/crm/field-layouts - Get field layout
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const moduleKey = searchParams.get('module') || 'crm'
    const entityType = searchParams.get('entityType') || 'lead'
    const viewType = searchParams.get('viewType') || 'CREATE'

    const layout = await prisma.fieldLayout.findUnique({
      where: {
        tenantId_module_entityType_viewType: {
          tenantId,
          module: moduleKey,
          entityType,
          viewType,
        },
      },
    })

    return NextResponse.json({
      layout: layout ? (layout.layoutJson as any) : null,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get field layout error:', error)
    return NextResponse.json(
      { error: 'Failed to get field layout', message: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/crm/field-layouts - Create or update field layout
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = fieldLayoutSchema.parse(body)

    // Upsert field layout
    const layout = await prisma.fieldLayout.upsert({
      where: {
        tenantId_module_entityType_viewType: {
          tenantId,
          module: validated.module,
          entityType: validated.entityType,
          viewType: validated.viewType,
        },
      },
      create: {
        tenantId,
        module: validated.module,
        entityType: validated.entityType,
        viewType: validated.viewType,
        layoutJson: validated.layoutJson,
        createdBy: userId,
      },
      update: {
        layoutJson: validated.layoutJson,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      layout: layout.layoutJson,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Save field layout error:', error)
    return NextResponse.json(
      { error: 'Failed to save field layout', message: error?.message },
      { status: 500 }
    )
  }
}

