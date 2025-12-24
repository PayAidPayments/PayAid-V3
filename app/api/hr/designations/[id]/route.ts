import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateDesignationSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/hr/designations/[id] - Get a single designation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const designation = await prisma.designation.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!designation) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(designation)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get designation error:', error)
    return NextResponse.json(
      { error: 'Failed to get designation' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/designations/[id] - Update a designation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.designation.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateDesignationSchema.parse(body)

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.designation.findFirst({
        where: {
          tenantId: tenantId,
          name: validated.name,
          id: { not: resolvedParams.id },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Designation with this name already exists' },
          { status: 400 }
        )
      }
    }

    const designation = await prisma.designation.update({
      where: { id: resolvedParams.id },
      data: validated,
    })

    return NextResponse.json(designation)
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

    console.error('Update designation error:', error)
    return NextResponse.json(
      { error: 'Failed to update designation' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/designations/[id] - Delete a designation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    // Check if designation has employees
    const employeeCount = await prisma.employee.count({
      where: {
        designationId: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete designation. ${employeeCount} employee(s) have this designation.` },
        { status: 400 }
      )
    }

    await prisma.designation.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Designation deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete designation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete designation' },
      { status: 500 }
    )
  }
}
