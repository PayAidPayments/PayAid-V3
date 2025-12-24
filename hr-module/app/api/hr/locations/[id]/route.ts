import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/hr/locations/[id] - Get a single location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get location error:', error)
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/locations/[id] - Update a location
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.location.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateLocationSchema.parse(body)

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.location.findFirst({
        where: {
          tenantId: tenantId,
          name: validated.name,
          id: { not: params.id },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Location with this name already exists' },
          { status: 400 }
        )
      }
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json(location)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update location error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/locations/[id] - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    // Check if location has employees
    const employeeCount = await prisma.employee.count({
      where: {
        locationId: params.id,
        tenantId: tenantId,
      },
    })

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. ${employeeCount} employee(s) are assigned to this location.` },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
