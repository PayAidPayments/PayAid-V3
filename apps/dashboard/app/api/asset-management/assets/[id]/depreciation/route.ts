import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const calculateDepreciationSchema = z.object({
  period: z.string().datetime(), // Month/Year
  method: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION']).optional(),
})

/**
 * POST /api/asset-management/assets/[id]/depreciation
 * Calculate depreciation for an asset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')
    const resolvedParams = await params

    const body = await request.json()
    const validated = calculateDepreciationSchema.parse(body)

    const asset = await prisma.asset.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Convert Prisma Decimal types to numbers for arithmetic operations
    const purchasePrice = asset.purchaseCostInr ? Number(asset.purchaseCostInr) : 0
    const currentValue = asset.currentValue ? Number(asset.currentValue) : purchasePrice
    const usefulLife = asset.usefulLifeYears || 1
    const depreciationRate = asset.depreciationRate ? Number(asset.depreciationRate) : 0
    const method = validated.method || asset.depreciationMethod || 'STRAIGHT_LINE'

    let depreciationAmount = 0
    let closingValue = currentValue

    if (method === 'STRAIGHT_LINE') {
      // Annual depreciation = (Purchase Price - Salvage Value) / Useful Life
      const annualDepreciation = purchasePrice / usefulLife
      const monthlyDepreciation = annualDepreciation / 12
      depreciationAmount = Number(monthlyDepreciation.toFixed(2))
      closingValue = Number((currentValue - depreciationAmount).toFixed(2))
    } else if (method === 'DECLINING_BALANCE') {
      // Annual depreciation = Current Value * Depreciation Rate
      const annualDepreciation = currentValue * (depreciationRate / 100)
      const monthlyDepreciation = annualDepreciation / 12
      depreciationAmount = Number(monthlyDepreciation.toFixed(2))
      closingValue = Number((currentValue - depreciationAmount).toFixed(2))
    } else if (method === 'UNITS_OF_PRODUCTION') {
      // This would require production units data - simplified for now
      depreciationAmount = 0
      closingValue = currentValue
    }

    // Check if depreciation record already exists for this period
    const existing = await prisma.assetDepreciation.findUnique({
      where: {
        assetId_period: {
          assetId: resolvedParams.id,
          period: new Date(validated.period),
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        depreciation: existing,
        message: 'Depreciation already calculated for this period',
      })
    }

    // Create depreciation record (Prisma accepts numbers for Decimal fields)
    const depreciation = await prisma.assetDepreciation.create({
      data: {
        assetId: resolvedParams.id,
        period: new Date(validated.period),
        openingValue: currentValue,
        depreciationAmount,
        closingValue,
      },
    })

    // Update asset current value (Prisma accepts numbers for Decimal fields)
    await prisma.asset.update({
      where: { id: resolvedParams.id },
      data: { currentValue: closingValue },
    })

    return NextResponse.json({
      depreciation,
      message: 'Depreciation calculated successfully',
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

    console.error('Calculate depreciation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate depreciation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/asset-management/assets/[id]/depreciation
 * Get depreciation history for an asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'asset-management')
    const resolvedParams = await params

    const asset = await prisma.asset.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const depreciationHistory = await prisma.assetDepreciation.findMany({
      where: { assetId: resolvedParams.id },
      orderBy: { period: 'desc' },
    })

    return NextResponse.json({
      asset: {
        id: asset.id,
        name: asset.assetTag,
        currentValue: asset.currentValue,
        purchasePrice: asset.purchaseCostInr,
      },
      depreciationHistory,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get depreciation history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch depreciation history' },
      { status: 500 }
    )
  }
}

