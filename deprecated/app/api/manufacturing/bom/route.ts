import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createBOMSchema = z.object({
  bomNumber: z.string().optional(),
  productName: z.string().min(1),
  productSku: z.string().optional(),
  items: z.array(
    z.object({
      materialName: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
      costPerUnit: z.number().optional(),
    })
  ).min(1),
  notes: z.string().optional(),
})

/**
 * GET /api/manufacturing/bom
 * List Bill of Materials
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'manufacturing')

    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')
    const isActive = searchParams.get('isActive')

    const where: any = { tenantId }
    if (productName) {
      where.productName = { contains: productName, mode: 'insensitive' }
    }
    if (isActive !== null) where.isActive = isActive === 'true'

    const boms = await prisma.manufacturingBOM.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ boms })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get BOMs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOMs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/manufacturing/bom
 * Create Bill of Materials
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'manufacturing')

    const body = await request.json()
    const validated = createBOMSchema.parse(body)

    // Generate BOM number if not provided
    const bomNumber = validated.bomNumber || 
      `BOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const bom = await prisma.manufacturingBOM.create({
      data: {
        tenantId,
        bomNumber,
        productName: validated.productName,
        productSku: validated.productSku,
        items: validated.items,
        notes: validated.notes,
        isActive: true,
      },
    })

    return NextResponse.json({ bom }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create BOM error:', error)
    return NextResponse.json(
      { error: 'Failed to create BOM' },
      { status: 500 }
    )
  }
}

