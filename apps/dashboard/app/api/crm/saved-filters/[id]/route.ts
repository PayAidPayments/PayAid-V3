import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateFilterSchema = z.object({
  name: z.string().min(1).optional(),
  filters: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().optional(),
})

// GET /api/crm/saved-filters/[id] - Get a specific saved filter
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)

    const savedFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        tenantId,
        OR: [
          { userId: user?.userId || null },
          { userId: null }, // Shared filters
        ],
      },
    })

    if (!savedFilter) {
      return NextResponse.json(
        { error: 'Saved filter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(savedFilter)
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get saved filter error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved filter', message: error?.message },
      { status: 500 }
    )
  }
}

// PUT /api/crm/saved-filters/[id] - Update a saved filter
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)

    if (!user?.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const savedFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        tenantId,
        userId: user.userId, // Users can only update their own filters
      },
    })

    if (!savedFilter) {
      return NextResponse.json(
        { error: 'Saved filter not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateFilterSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          tenantId,
          userId: user.userId,
          entityType: savedFilter.entityType,
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.savedFilter.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json(updated)
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

    console.error('Update saved filter error:', error)
    return NextResponse.json(
      { error: 'Failed to update saved filter', message: error?.message },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/saved-filters/[id] - Delete a saved filter
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)

    if (!user?.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const savedFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        tenantId,
        userId: user.userId, // Users can only delete their own filters
      },
    })

    if (!savedFilter) {
      return NextResponse.json(
        { error: 'Saved filter not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.savedFilter.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete saved filter error:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved filter', message: error?.message },
      { status: 500 }
    )
  }
}

