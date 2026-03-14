import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createSalaryStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  structureJson: z.object({
    earnings: z.array(z.object({
      name: z.string(),
      type: z.enum(['fixed', 'variable', 'allowance']),
      amount: z.number().optional(),
      percentage: z.number().optional(),
      formula: z.string().optional(),
    })),
    deductions: z.array(z.object({
      name: z.string(),
      type: z.enum(['statutory', 'voluntary', 'loan']),
      amount: z.number().optional(),
      percentage: z.number().optional(),
      formula: z.string().optional(),
    })),
  }),
})

// GET /api/hr/payroll/salary-structures - List all salary structures
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { employeeSalaryStructures: true },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ structures })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get salary structures error:', error)
    return NextResponse.json(
      { error: 'Failed to get salary structures', structures: [] },
      { status: 500 }
    )
  }
}

// POST /api/hr/payroll/salary-structures - Create a new salary structure
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createSalaryStructureSchema.parse(body)

    // If this is set as default, unset other defaults
    if (validated.isDefault) {
      await prisma.salaryStructure.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        isDefault: validated.isDefault,
        structureJson: validated.structureJson,
      },
    })

    return NextResponse.json({ structure }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create salary structure error:', error)
    return NextResponse.json(
      { error: 'Failed to create salary structure' },
      { status: 500 }
    )
  }
}
