import { NextRequest, NextResponse } from 'next/server'
import { processScheduledReports } from '@/lib/background-jobs/process-scheduled-reports'

/**
 * Cron endpoint to process scheduled reports
 * Should be called periodically (e.g., every hour)
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

    // Process scheduled reports
    const result = await processScheduledReports()

    return NextResponse.json({
      success: true,
      processed: result.total,
      succeeded: result.success,
      failed: result.failures,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled reports' },
      { status: 500 }
    )
  }
}

