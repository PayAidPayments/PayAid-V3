/**
 * Scheduled Reports Cron Job
 * POST /api/cron/process-scheduled-reports - Process scheduled reports
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external scheduler)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportSchedulerService } from '@/lib/reporting/report-scheduler'

// POST /api/cron/process-scheduled-reports - Process scheduled reports
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional, for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await ReportSchedulerService.processScheduledReports()

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Process scheduled reports error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process scheduled reports' },
      { status: 500 }
    )
  }
}
