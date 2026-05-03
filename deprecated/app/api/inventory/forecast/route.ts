import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { calculateInventoryForecast, getProductsNeedingReorder, performABCAnalysis } from '@/lib/inventory/forecasting'

// GET /api/inventory/forecast - Get inventory forecasts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') || 'forecast' // forecast, reorder, abc
    const days = parseInt(searchParams.get('days') || '30')

    if (type === 'abc') {
      // ABC Analysis
      const abcAnalysis = await performABCAnalysis(tenantId)
      return NextResponse.json({ abcAnalysis })
    }

    if (productId) {
      // Single product forecast
      const forecast = await calculateInventoryForecast(tenantId, productId, days)
      if (!forecast) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ forecast })
    }

    if (type === 'reorder') {
      // Products needing reorder
      const products = await getProductsNeedingReorder(tenantId, days)
      return NextResponse.json({ products })
    }

    // All products forecast (limited to 50 for performance)
    const products = await prisma.product.findMany({
      where: { tenantId },
      take: 50,
      orderBy: { quantity: 'asc' },
    })

    const forecasts = await Promise.all(
      products.map((product) => calculateInventoryForecast(tenantId, product.id, days))
    )

    return NextResponse.json({
      forecasts: forecasts.filter((f): f is typeof forecasts[0] => f !== null),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get inventory forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate inventory forecast' },
      { status: 500 }
    )
  }
}

