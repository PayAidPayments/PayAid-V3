import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const calculateMRPSchema = z.object({
  productSku: z.string(),
  quantity: z.number().positive(),
  bomId: z.string().optional(),
})

/**
 * POST /api/manufacturing/mrp
 * Calculate Material Requirements Planning (MRP)
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'manufacturing')

    const body = await request.json()
    const validated = calculateMRPSchema.parse(body)

    // Find BOM for the product
    let bom
    if (validated.bomId) {
      bom = await prisma.manufacturingBOM.findFirst({
        where: {
          id: validated.bomId,
          tenantId,
          isActive: true,
        },
      })
    } else {
      bom = await prisma.manufacturingBOM.findFirst({
        where: {
          tenantId,
          productSku: validated.productSku,
          isActive: true,
        },
      })
    }

    if (!bom) {
      return NextResponse.json(
        { error: 'BOM not found for this product' },
        { status: 404 }
      )
    }

    const bomItems = bom.items as any[]
    const requirements: any[] = []

    // Calculate material requirements
    for (const item of bomItems) {
      const requiredQuantity = item.quantity * validated.quantity

      // Check current inventory (using Product model)
      const inventory = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: item.materialName,
        },
      })

      const availableQuantity = inventory?.quantity || 0
      const shortfall = Math.max(0, requiredQuantity - availableQuantity)

      requirements.push({
        materialName: item.materialName,
        unit: item.unit,
        requiredQuantity,
        availableQuantity,
        shortfall,
        costPerUnit: item.costPerUnit || 0,
        totalCost: (item.costPerUnit || 0) * requiredQuantity,
        needsPurchase: shortfall > 0,
      })
    }

    const totalCost = requirements.reduce((sum, req) => sum + req.totalCost, 0)
    const totalShortfall = requirements.reduce((sum, req) => sum + req.shortfall, 0)

    return NextResponse.json({
      bom: {
        id: bom.id,
        bomNumber: bom.bomNumber,
        productName: bom.productName,
      },
      productionQuantity: validated.quantity,
      requirements,
      summary: {
        totalMaterials: requirements.length,
        totalCost,
        totalShortfall,
        canProduce: totalShortfall === 0,
      },
    })
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

    console.error('Calculate MRP error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate MRP' },
      { status: 500 }
    )
  }
}

