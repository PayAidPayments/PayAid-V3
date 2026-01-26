/**
 * Account Engagement API
 * GET /api/accounts/[id]/engagement - Get engagement timeline
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AccountEngagementService } from '@/lib/accounts/account-engagement'

// GET /api/accounts/[id]/engagement - Get engagement timeline
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined

    const timeline = await AccountEngagementService.getEngagementTimeline(
      tenantId,
      params.id,
      dateRange
    )

    return NextResponse.json({
      success: true,
      data: timeline,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get engagement timeline error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get engagement timeline' },
      { status: 500 }
    )
  }
}
