import { NextRequest, NextResponse } from 'next/server'
import { checkFollowUps, checkHotLeads } from '@/lib/background-jobs/check-follow-ups'

/**
 * POST /api/cron/check-follow-ups
 * Cron job endpoint to check for due follow-ups and hot leads
 * Should be called hourly
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Require authentication token
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId = body.tenantId // Optional: check for specific tenant

    // Check follow-ups
    const followUpResult = await checkFollowUps(tenantId)

    // Check hot leads
    const hotLeadResult = await checkHotLeads(tenantId)

    // Check due tasks
    const { checkTaskDue } = await import('@/lib/background-jobs/check-task-due')
    const taskResult = await checkTaskDue(tenantId)

    return NextResponse.json({
      success: true,
      message: 'Follow-ups, hot leads, and tasks checked',
      followUps: followUpResult,
      hotLeads: hotLeadResult,
      tasks: taskResult,
    })
  } catch (error) {
    console.error('Check follow-ups cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check follow-ups',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
