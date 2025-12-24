import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createSalaryStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  structureJson: z.record(z.any()), // JSON structure definition
  isDefault: z.boolean().default(false),
})

// GET /api/hr/payroll/salary-structures - List all salary structures
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const isDefault = searchParams.get('isDefault')

    const where: any = {
      tenantId: tenantId,
    }

    if (isDefault !== null) {
      where.isDefault = isDefault === 'true'
    }

    const structures = await prisma.salaryStructure.findMany({
      where,
      include: {
        _count: {
          select: { employeeSalaryStructures: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ structures })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get salary structures error:', error)
    return NextResponse.json(
      { error: 'Failed to get salary structures' },
      { status: 500 }
    )
  }
}

// POST /api/hr/payroll/salary-structures - Create a new salary structure
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createSalaryStructureSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.salaryStructure.updateMany({
        where: {
          tenantId: tenantId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        name: validated.name,
        description: validated.description,
        structureJson: validated.structureJson,
        isDefault: validated.isDefault,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(structure, { status: 201 })
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

    console.error('Create salary structure error:', error)
    return NextResponse.json(
      { error: 'Failed to create salary structure' },
      { status: 500 }
    )
  }
}
