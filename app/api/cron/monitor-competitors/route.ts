import { NextRequest, NextResponse } from 'next/server'
import { monitorCompetitorsJob } from '@/lib/background-jobs/monitor-competitors'

/**
 * Cron endpoint to monitor competitors
 * Should be called periodically (e.g., daily)
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenantId from query params if provided
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || undefined

    // Monitor competitors
    const result = await monitorCompetitorsJob(tenantId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Competitor monitoring cron error:', error)
    return NextResponse.json(
      { error: 'Failed to monitor competitors' },
      { status: 500 }
    )
  }
}

