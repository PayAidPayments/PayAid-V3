import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createTaxCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1), // 80C, 80D, HRA, etc.
  description: z.string().optional(),
  maxAmountInr: z.number().positive().optional(),
})

// GET /api/hr/tax-declarations/categories - List tax declaration categories
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const categories = await prisma.taxDeclarationCategory.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { declarations: true },
        },
      },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get tax categories error:', error)
    return NextResponse.json(
      { error: 'Failed to get tax declaration categories' },
      { status: 500 }
    )
  }
}

// POST /api/hr/tax-declarations/categories - Create tax declaration category
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createTaxCategorySchema.parse(body)

    // Check for duplicate code
    const existing = await prisma.taxDeclarationCategory.findUnique({
      where: {
        tenantId_code: {
          tenantId: tenantId,
          code: validated.code,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Tax category with this code already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.taxDeclarationCategory.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        maxAmountInr: validated.maxAmountInr
          ? new Decimal(validated.maxAmountInr.toString())
          : null,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(category, { status: 201 })
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

    console.error('Create tax category error:', error)
    return NextResponse.json(
      { error: 'Failed to create tax declaration category' },
      { status: 500 }
    )
  }
}
