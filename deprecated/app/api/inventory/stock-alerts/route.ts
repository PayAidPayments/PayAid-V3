import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { checkStockAlerts, sendStockAlertNotifications } from '@/lib/inventory/stock-alerts'

// GET /api/inventory/stock-alerts - Get current stock alerts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId') || undefined

    const alerts = await checkStockAlerts(tenantId, locationId)

    return NextResponse.json({ alerts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get stock alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to get stock alerts' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/stock-alerts/check - Manually trigger stock alert check
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId') || undefined
    const sendNotifications = searchParams.get('notify') === 'true'

    const alerts = await checkStockAlerts(tenantId, locationId)

    if (sendNotifications && alerts.length > 0) {
      await sendStockAlertNotifications(tenantId, alerts)
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      notificationsSent: sendNotifications && alerts.length > 0,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Check stock alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock alerts' },
      { status: 500 }
    )
  }
}

