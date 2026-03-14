import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateBusinessUnitSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  industryPacks: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/business-units/[id] - Get a single business unit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const unit = await prisma.businessUnit.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ unit })
  } catch (error) {
    console.error('Get business unit error:', error)
    return NextResponse.json(
      { error: 'Failed to get business unit' },
      { status: 500 }
    )
  }
}

// PATCH /api/business-units/[id] - Update a business unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateBusinessUnitSchema.parse(body)

    // Check if unit exists and belongs to tenant
    const existing = await prisma.businessUnit.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    // Update unit
    const unit = await prisma.businessUnit.update({
      where: { id: resolvedParams.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.industryPacks && { industryPacks: validated.industryPacks as any }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    })

    return NextResponse.json({ unit })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update business unit error:', error)
    return NextResponse.json(
      { error: 'Failed to update business unit' },
      { status: 500 }
    )
  }
}

// DELETE /api/business-units/[id] - Delete a business unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Check if unit exists and belongs to tenant
    const existing = await prisma.businessUnit.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    await prisma.businessUnit.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete business unit error:', error)
    return NextResponse.json(
      { error: 'Failed to delete business unit' },
      { status: 500 }
    )
  }
}
