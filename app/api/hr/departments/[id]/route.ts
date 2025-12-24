import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/hr/departments/[id] - Get a single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const department = await prisma.department.findFirst({
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

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(department)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get department error:', error)
    return NextResponse.json(
      { error: 'Failed to get department' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/departments/[id] - Update a department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.department.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateDepartmentSchema.parse(body)

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.department.findFirst({
        where: {
          tenantId: tenantId,
          name: validated.name,
          id: { not: resolvedParams.id },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Department with this name already exists' },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.update({
      where: { id: resolvedParams.id },
      data: validated,
    })

    return NextResponse.json(department)
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

    console.error('Update department error:', error)
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/departments/[id] - Delete a department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    // Check if department has employees
    const employeeCount = await prisma.employee.count({
      where: {
        departmentId: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete department. ${employeeCount} employee(s) are assigned to this department.` },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Department deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete department error:', error)
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}
