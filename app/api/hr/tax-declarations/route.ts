import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createTaxDeclarationSchema = z.object({
  employeeId: z.string(),
  categoryId: z.string(),
  financialYear: z.string(), // 2024-25, 2025-26, etc.
  declaredAmountInr: z.number().positive(),
})

// GET /api/hr/tax-declarations - List tax declarations
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const financialYear = searchParams.get('financialYear')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (employeeId) where.employeeId = employeeId
    if (financialYear) where.financialYear = financialYear
    if (status) where.status = status

    const [declarations, total] = await Promise.all([
      prisma.employeeTaxDeclaration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          category: true,
          _count: {
            select: { proofDocuments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeTaxDeclaration.count({ where }),
    ])

    return NextResponse.json({
      declarations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get tax declarations error:', error)
    return NextResponse.json(
      { error: 'Failed to get tax declarations' },
      { status: 500 }
    )
  }
}

// POST /api/hr/tax-declarations - Create tax declaration
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createTaxDeclarationSchema.parse(body)

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: validated.employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Verify category belongs to tenant
    const category = await prisma.taxDeclarationCategory.findFirst({
      where: {
        id: validated.categoryId,
        tenantId: tenantId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Tax category not found' },
        { status: 404 }
      )
    }

    // Check max amount
    if (
      category.maxAmountInr &&
      validated.declaredAmountInr > Number(category.maxAmountInr)
    ) {
      return NextResponse.json(
        {
          error: `Declared amount exceeds maximum allowed: ₹${Number(category.maxAmountInr).toLocaleString('en-IN')}`,
        },
        { status: 400 }
      )
    }

    const declaration = await prisma.employeeTaxDeclaration.create({
      data: {
        employeeId: validated.employeeId,
        categoryId: validated.categoryId,
        financialYear: validated.financialYear,
        declaredAmountInr: new Decimal(validated.declaredAmountInr.toString()),
        status: 'PENDING',
        tenantId: tenantId,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(declaration, { status: 201 })
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

    console.error('Create tax declaration error:', error)
    return NextResponse.json(
      { error: 'Failed to create tax declaration' },
      { status: 500 }
    )
  }
}
