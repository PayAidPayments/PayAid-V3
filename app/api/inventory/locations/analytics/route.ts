import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getLocationAnalytics, getMultiLocationInventory, autoBalanceStock } from '@/lib/inventory/multi-location'

// GET /api/inventory/locations/analytics - Get location analytics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const locationId = request.nextUrl.searchParams.get('locationId')
    const analytics = await getLocationAnalytics(tenantId, locationId || undefined)

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error: any) {
    console.error('Location analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/locations/analytics/balance - Auto-balance stock
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { productId, targetLocations } = body

    if (!productId || !targetLocations) {
      return NextResponse.json(
        { error: 'productId and targetLocations are required' },
        { status: 400 }
      )
    }

    await autoBalanceStock(tenantId, productId, targetLocations)

    return NextResponse.json({
      success: true,
      message: 'Stock balancing initiated',
    })
  } catch (error: any) {
    console.error('Stock balancing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to balance stock' },
      { status: 500 }
    )
  }
}

