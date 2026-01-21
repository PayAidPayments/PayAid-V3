/**
 * Analytics Dashboard API Route
 * GET /api/analytics/dashboard/[id] - Get dashboard with widgets
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, DashboardWidget } from '@/types/base-modules'

/**
 * Get dashboard
 * GET /api/analytics/dashboard/[id]?organizationId=xxx
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  // Return default dashboard widgets
  // In production, fetch from database
  const widgets: DashboardWidget[] = []

  const response: ApiResponse<{
    dashboardId: string
    widgets: DashboardWidget[]
  }> = {
    success: true,
    statusCode: 200,
    data: {
      dashboardId: id,
      widgets,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
