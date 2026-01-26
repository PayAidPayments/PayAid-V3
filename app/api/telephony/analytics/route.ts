import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { AdvancedTelephonyService } from '@/lib/telephony/advanced-features'
import { z } from 'zod'

const analyticsRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * GET /api/telephony/analytics
 * Get call analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    const analytics = await AdvancedTelephonyService.getCallAnalytics(tenantId, startDate, endDate)

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Call analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get call analytics' },
      { status: 500 }
    )
  }
}
