import { NextRequest, NextResponse } from 'next/server'
import { processSubscriptionRenewals } from '@/lib/background-jobs/process-subscription-renewals'

/**
 * Cron endpoint to process subscription renewals
 * Should be called daily
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

    // Process subscription renewals
    const result = await processSubscriptionRenewals()

    return NextResponse.json({
      success: true,
      processed: result.total,
      succeeded: result.success,
      failed: result.failures,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription renewals' },
      { status: 500 }
    )
  }
}

