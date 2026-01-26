import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getActivityFeed } from '@/lib/collaboration/activity-feed'

/**
 * GET /api/crm/activity-feed
 * Get activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const entityType = (searchParams.get('entityType') as 'deal' | 'contact' | 'task' | 'project' | 'all') || 'all'
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const activities = await getActivityFeed(
      entityType,
      entityId,
      tenantId,
      { limit, offset }
    )

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}
