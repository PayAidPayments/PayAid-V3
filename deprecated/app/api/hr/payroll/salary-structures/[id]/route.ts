import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateSalaryStructureSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  structureJson: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
})

// GET /api/hr/payroll/salary-structures/[id] - Get a single salary structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const structure = await prisma.salaryStructure.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { employeeSalaryStructures: true },
        },
      },
    })

    if (!structure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(structure)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get salary structure error:', error)
    return NextResponse.json(
      { error: 'Failed to get salary structure' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/payroll/salary-structures/[id] - Update a salary structure
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const existing = await prisma.salaryStructure.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateSalaryStructureSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault === true) {
      await prisma.salaryStructure.updateMany({
        where: {
          tenantId: tenantId,
          isDefault: true,
          id: { not: resolvedParams.id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.structureJson !== undefined) updateData.structureJson = validated.structureJson
    if (validated.isDefault !== undefined) updateData.isDefault = validated.isDefault

    const structure = await prisma.salaryStructure.update({
      where: { id: resolvedParams.id },
      data: updateData,
    })

    return NextResponse.json(structure)
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

    console.error('Update salary structure error:', error)
    return NextResponse.json(
      { error: 'Failed to update salary structure' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/payroll/salary-structures/[id] - Delete a salary structure
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const structure = await prisma.salaryStructure.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { employeeSalaryStructures: true },
        },
      },
    })

    if (!structure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    // Check if structure is assigned to employees
    if (structure._count.employeeSalaryStructures > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete structure. ${structure._count.employeeSalaryStructures} employee(s) are using this structure.`,
        },
        { status: 400 }
      )
    }

    await prisma.salaryStructure.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Salary structure deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete salary structure error:', error)
    return NextResponse.json(
      { error: 'Failed to delete salary structure' },
      { status: 500 }
    )
  }
}
