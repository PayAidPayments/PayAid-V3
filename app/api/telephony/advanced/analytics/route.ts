import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AdvancedTelephonyService } from '@/lib/telephony/advanced-features'

/**
 * GET /api/telephony/advanced/analytics?startDate=...&endDate=...
 * Get call analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date()

    const analytics = await AdvancedTelephonyService.getCallAnalytics(tenantId, startDate, endDate)

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('[Telephony Analytics] Error:', error)
    return handleLicenseError(error)
  }
}
