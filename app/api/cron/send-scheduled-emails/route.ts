import { NextRequest, NextResponse } from 'next/server'
import { processScheduledEmails } from '@/lib/background-jobs/send-scheduled-emails'

/**
 * POST /api/cron/send-scheduled-emails
 * Cron job endpoint to send scheduled emails
 * Should be called every 15 minutes via cron or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Add authentication/authorization here
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId = body.tenantId // Optional: process for specific tenant

    const result = await processScheduledEmails(tenantId)

    return NextResponse.json({
      success: true,
      message: 'Scheduled emails processed',
      ...result,
    })
  } catch (error) {
    console.error('Send scheduled emails cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process scheduled emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
