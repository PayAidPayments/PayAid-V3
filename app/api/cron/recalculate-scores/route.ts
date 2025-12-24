import { NextRequest, NextResponse } from 'next/server'
import { recalculateAllLeadScores } from '@/lib/background-jobs/recalculate-lead-scores'

/**
 * POST /api/cron/recalculate-scores
 * Cron job endpoint to recalculate all lead scores
 * Should be called hourly via cron or scheduled task
 * 
 * Security: Add API key or secret header check in production
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Require authentication token for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId = body.tenantId // Optional: recalculate for specific tenant

    const result = await recalculateAllLeadScores(tenantId)

    return NextResponse.json({
      success: true,
      message: 'Lead scores recalculated',
      ...result,
    })
  } catch (error) {
    console.error('Recalculate scores cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to recalculate scores',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
